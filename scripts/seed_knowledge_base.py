#!/usr/bin/env python3
import argparse
import html
import json
import re
import sys
from collections import Counter, OrderedDict
from urllib.parse import urljoin


def import_or_none(module_name, attr_name=None):
    try:
        module = __import__(module_name, fromlist=[attr_name] if attr_name else [])
        return getattr(module, attr_name) if attr_name else module
    except Exception:
        return None


requests = import_or_none("requests")
BeautifulSoup = import_or_none("bs4", "BeautifulSoup")

STOP_WORDS = {
    "about",
    "after",
    "also",
    "and",
    "are",
    "been",
    "but",
    "can",
    "during",
    "for",
    "from",
    "have",
    "help",
    "into",
    "its",
    "more",
    "not",
    "our",
    "that",
    "the",
    "their",
    "them",
    "this",
    "through",
    "will",
    "with",
}

URL_ALIASES = {
    "https://www.clarku.edu/offices/information-technology/": "https://www.clarku.edu/information-technology-services/",
    "https://www.clarku.edu/offices/student-engagement/higgins-university-center/": "https://www.clarku.edu/offices/student-programming/higgins-university-center/",
    "https://www.clarku.edu/offices/public-safety/": "https://www.clarku.edu/offices/emergency-management-and-campus-assistance/",
    "https://www.clarku.edu/academics/academic-calendar/": "https://www.clarku.edu/offices/registrar/academic-calendars/",
}


def warn(message):
    print(message, file=sys.stderr)


def normalize_space(value):
    cleaned = html.unescape(value or "")
    cleaned = cleaned.replace("\xa0", " ")
    cleaned = cleaned.replace("\u2013", "-").replace("\u2014", "-")
    cleaned = cleaned.replace("\u2018", "'").replace("\u2019", "'")
    cleaned = cleaned.replace("\u201c", '"').replace("\u201d", '"')
    cleaned = cleaned.replace("\ufffd", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def keywords_for(*parts):
    tokens = []
    for part in parts:
        for token in re.split(r"[^a-zA-Z0-9]+", (part or "").lower()):
            if len(token) > 2 and token not in STOP_WORDS and token not in tokens:
                tokens.append(token)
    return tokens[:16]


def split_sentences(text):
    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", normalize_space(text))
        if sentence.strip()
    ]


def trim_fact(text, max_sentences=3):
    sentences = split_sentences(text)
    if not sentences:
        return ""
    return " ".join(sentences[:max_sentences])


def make_record(title, content, source, category, *keyword_parts):
    clean_title = normalize_space(title)
    clean_content = trim_fact(content)
    if not clean_title or not clean_content:
        return None
    return {
        "title": clean_title,
        "content": clean_content,
        "keywords": keywords_for(clean_title, clean_content, *keyword_parts),
        "source": source,
        "category": category,
    }


def add_record(records, seen, title, content, source, category, *keyword_parts):
    record = make_record(title, content, source, category, *keyword_parts)
    if not record:
        return
    key = (record["title"].lower(), record["content"].lower(), source)
    if key in seen:
        return
    seen.add(key)
    records.append(record)


def fetch_response(url):
    if requests is None:
        raise RuntimeError("requests is not installed")
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; CortexKnowledgeSeeder/1.0; +https://clark.edu)"
    }
    response = requests.get(url, timeout=30, headers=headers)
    if response.status_code == 404 and url in URL_ALIASES:
        response = requests.get(URL_ALIASES[url], timeout=30, headers=headers)
    response.raise_for_status()
    return response


def fetch_soup(url):
    if BeautifulSoup is None:
        raise RuntimeError("beautifulsoup4 is not installed")
    response = fetch_response(url)
    return BeautifulSoup(response.text, "html.parser"), response.text, response.url


def collect_text_lines(node):
    lines = []
    for raw_line in node.get_text("\n").splitlines():
        line = normalize_space(raw_line)
        if not line:
            continue
        if lines and lines[-1] == line:
            continue
        lines.append(line)
    return lines


def find_line_index(lines, pattern):
    regex = re.compile(pattern, re.IGNORECASE)
    for index, line in enumerate(lines):
        if regex.search(line):
            return index
    return -1


def collect_section(lines, start_pattern, stop_patterns, max_lines=40):
    start_index = find_line_index(lines, start_pattern)
    if start_index == -1:
        return []

    regexes = [re.compile(pattern, re.IGNORECASE) for pattern in stop_patterns]
    collected = []
    for line in lines[start_index + 1 :]:
        if any(regex.search(line) for regex in regexes):
            break
        collected.append(line)
        if len(collected) >= max_lines:
            break
    return collected


def find_links(soup, href_pattern):
    regex = re.compile(href_pattern, re.IGNORECASE)
    links = []
    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href", "")
        if regex.search(href):
            links.append(href)
    return list(OrderedDict.fromkeys(links))


def follow_official_link(soup, base_url, href_pattern):
    links = find_links(soup, href_pattern)
    if not links:
        return None
    return urljoin(base_url, links[0])


def chunk_list(items, size):
    return [items[index : index + size] for index in range(0, len(items), size)]


def unique_preserve_casefold(items):
    seen = set()
    values = []
    for item in items:
        normalized = normalize_space(item)
        key = normalized.casefold()
        if not normalized or key in seen:
            continue
        seen.add(key)
        values.append(normalized)
    return values


def scrape_libcal_hours(url):
    soup, _, _ = fetch_soup(url)
    records = []
    seen = set()
    rows = []

    for row in soup.find_all("tr"):
        cells = [normalize_space(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
        if len(cells) >= 8 and "Goddard Library" in cells[0]:
            rows.append(cells[:8])

    if not rows:
        raise RuntimeError("No Goddard Library hours row found")

    _, sunday, monday, tuesday, wednesday, thursday, friday, saturday = Counter(
        [tuple(row) for row in rows]
    ).most_common(1)[0][0]

    if sum(1 for value in [friday, saturday, sunday] if "closed" in value.lower()) >= 2:
        raise RuntimeError("Library hours snapshot appears too atypical for a stable seed record")
    weekday_hours = OrderedDict(
        [
            ("Monday", monday),
            ("Tuesday", tuesday),
            ("Wednesday", wednesday),
            ("Thursday", thursday),
        ]
    )

    if len(set(weekday_hours.values())) == 1:
        weekday_text = f"Goddard Library is open Monday through Thursday from {weekday_hours['Monday']}."
    else:
        weekday_text = " ".join([f"{day}: {hours}." for day, hours in weekday_hours.items()])

    add_record(records, seen, "Library Hours - Monday Through Thursday", weekday_text, url, "hours", "library", "goddard")
    add_record(records, seen, "Library Hours - Friday", f"Goddard Library is open on Friday from {friday}.", url, "hours", "library", "friday")
    add_record(records, seen, "Library Hours - Saturday", f"Goddard Library is open on Saturday from {saturday}.", url, "hours", "library", "saturday")
    add_record(records, seen, "Library Hours - Sunday", f"Goddard Library is open on Sunday from {sunday}.", url, "hours", "library", "sunday")

    page_text = normalize_space(soup.get_text(" ", strip=True))
    if re.search(r"holiday|break|closed", page_text, re.IGNORECASE):
        add_record(
            records,
            seen,
            "Library Hours - Schedule Changes",
            "Library hours can change during breaks, holidays, and special periods, so students should confirm the latest times on the LibCal hours page.",
            url,
            "hours",
            "library",
            "holiday",
            "break",
        )

    return records


def scrape_athletics_hours(url):
    soup, html_text, _ = fetch_soup(url)
    records = []
    seen = set()
    text = normalize_space(soup.get_text(" ", strip=True))

    note_match = re.search(
        r"Note:\s*The hours listed are the hours the facility is open\.[^.]*\.",
        text,
        re.IGNORECASE,
    )
    if note_match:
        add_record(
            records,
            seen,
            "Gym Hours - Facility Hours Policy",
            note_match.group(0),
            url,
            "hours",
            "athletics",
            "gym",
            "facility",
        )

    contact_match = re.search(
        r"57 Downing Street, Worcester, Mass\.\s*Phn:\s*([0-9.]+)\s*/\s*Fax:\s*([0-9.]+)\s*([A-Za-z0-9._%+-]+@clarku\.edu)",
        text,
        re.IGNORECASE,
    )
    if contact_match:
        add_record(
            records,
            seen,
            "Athletics Contact",
            f"Clark Athletics is located at 57 Downing Street. Call {contact_match.group(1)} or email {contact_match.group(3)}.",
            url,
            "contact",
            "athletics",
            "contact",
        )

    calendar_links = re.findall(r"https://calendar\.google\.com/[^\s\"'>]+", html_text)
    if calendar_links:
        add_record(
            records,
            seen,
            "Gym Hours - Calendar Source",
            "Clark Athletics publishes detailed facility-hour updates through linked calendar feeds on the official facility-hours page.",
            url,
            "hours",
            "athletics",
            "calendar",
            "schedule",
        )

    if len(records) < 2:
        raise RuntimeError("Athletics page is too thin for reliable fact chunking")

    return records


def scrape_health_services(url):
    soup, _, _ = fetch_soup(url)
    lines = collect_text_lines(soup)
    blob = "\n".join(lines)
    records = []
    seen = set()

    welcome_match = re.search(
        r"Welcome to Health Services\s+(All of Clark University's students may use Health Services.+?fee-for-service basis\.)",
        blob,
        re.IGNORECASE,
    )
    if welcome_match:
        add_record(records, seen, "Health Center Eligibility", welcome_match.group(1), url, "services", "health", "students", "fees")

    hours_line = next((line for line in lines if "Health Services is open Monday through Friday" in line), "")
    if hours_line:
        add_record(records, seen, "Health Center Hours", hours_line, url, "hours", "health", "hours")

    appointment_line = next((line for line in lines if "Please call us at" in line and "schedule an appointment" in line), "")
    availability_line = next((line for line in lines if "Typically, patients are seen within" in line), "")
    if appointment_line:
        add_record(
            records,
            seen,
            "Health Center Appointments",
            f"{appointment_line} {availability_line}".strip(),
            url,
            "contact",
            "health",
            "appointment",
            "phone",
        )

    if "Campus Police" in blob and "911" in blob:
        add_record(
            records,
            seen,
            "Health Center Emergencies",
            "For an on-campus medical emergency, call Campus Police at 1-508-793-7575. If you are off campus, call 911.",
            url,
            "emergency",
            "health",
            "emergency",
        )

    service_index = find_line_index(lines, r"Clark Health Services offers these services and programs")
    if service_index != -1:
        service_items = []
        for line in lines[service_index + 1 :]:
            if re.search(r"Clark covid-19 information|Information for parents|Helpful links|Contact information", line, re.IGNORECASE):
                break
            if len(line) > 8:
                service_items.append(line.lstrip("- ").strip())
        for index, service_group in enumerate(chunk_list(service_items, 2), start=1):
            if len(service_group) > 1:
                content = f"Clark Health Services offers {', '.join(service_group[:-1])}, and {service_group[-1]}."
            else:
                content = f"Clark Health Services offers {service_group[0]}."
            add_record(records, seen, f"Health Center Services - {index}", content, url, "services", "health", "services")

    if re.search(r"1-508-793-7467", blob) or re.search(r"healthservices@clarku\.edu", blob, re.IGNORECASE):
        add_record(
            records,
            seen,
            "Health Center Contact",
            "Clark Health Services is located at 501 Park Ave, Worcester, MA 01610. Call 1-508-793-7467 or email healthservices@clarku.edu.",
            url,
            "contact",
            "health",
            "contact",
        )

    if len(records) < 4:
        raise RuntimeError(f"Parsed only {len(records)} health records")

    return records


def scrape_its_help(url):
    soup, _, final_url = fetch_soup(url)
    lines = collect_text_lines(soup)
    blob = "\n".join(lines)
    records = []
    seen = set()

    if "Information Technology Services" not in blob and "ITS Help Desk" not in blob:
        linked_url = follow_official_link(soup, final_url, r"information-technology-services")
        if linked_url:
            soup, _, _ = fetch_soup(linked_url)
            lines = collect_text_lines(soup)
            blob = "\n".join(lines)

    if re.search(r"central provider of technology services for the Clark community", blob, re.IGNORECASE):
        add_record(
            records,
            seen,
            "IT Help - ITS Role",
            "Information Technology Services is the central provider of technology services for the Clark community.",
            url,
            "services",
            "its",
            "technology",
        )

    helpdesk_index = find_line_index(lines, r"ITS Help Desk")
    if helpdesk_index != -1:
        nearby_lines = lines[helpdesk_index + 1 : helpdesk_index + 10]
        location = next((line for line in nearby_lines if "Academic Commons" in line or "Plaza Level" in line), "Academic Commons, Plaza Level")
        phone = next((line for line in nearby_lines if re.search(r"1-508-793-7745|508-793-7745", line)), "508-793-7745")
        email = next((line for line in nearby_lines if "helpdesk@clarku.edu" in line.lower()), "helpdesk@clarku.edu")
        add_record(
            records,
            seen,
            "IT Help Desk Contact",
            f"The ITS Help Desk is located in {location}. Call {phone} or email {email}.",
            url,
            "contact",
            "its",
            "help desk",
            "contact",
        )

    hours_lines = collect_section(
        lines,
        r"(Spring Term Hours|Fall 2025|Fall 2024)",
        [r"Hours may vary", r"Common Questions", r"Explore", r"Be a force for change", r"Undergraduate", r"Graduate"],
        max_lines=6,
    )
    if hours_lines:
        add_record(
            records,
            seen,
            "IT Help Desk Hours",
            f"ITS Help Desk hours are {' '.join(hours_lines)}. Hours may vary on university holidays.",
            url,
            "hours",
            "its",
            "help desk",
            "hours",
        )

    common_tasks = unique_preserve_casefold(
        [
        line
        for line in lines
        if line.lower() in {"activate your account", "connect to the network", "check systems status", "connect to clark's network"}
        ]
    )
    if common_tasks:
        if len(common_tasks) > 1:
            content = f"ITS supports common tasks such as {', '.join(common_tasks[:-1])}, and {common_tasks[-1]}."
        else:
            content = f"ITS supports {common_tasks[0]}."
        add_record(records, seen, "IT Help - Common Tasks", content, url, "services", "its", "account", "network", "system status")

    if len(records) < 3:
        raise RuntimeError(f"Parsed only {len(records)} ITS records")

    return records


def scrape_registrar(url):
    soup, _, _ = fetch_soup(url)
    lines = collect_text_lines(soup)
    blob = "\n".join(lines)
    records = []
    seen = set()

    responsibility_match = re.search(
        r"The Registrar's Office is responsible for maintaining the accuracy and integrity of all student academic records such as transcripts, enrollment verification, and degree certifications\.",
        blob,
        re.IGNORECASE,
    )
    if responsibility_match:
        add_record(records, seen, "Registrar Responsibilities", responsibility_match.group(0), url, "services", "registrar", "records")

    functions = collect_section(lines, r"The Registrar's Office also", [r"Quick Links", r"Contact Information"], max_lines=8)
    if functions:
        cleaned_functions = unique_preserve_casefold([item.rstrip(".") for item in functions])
        for index, function_group in enumerate(chunk_list(cleaned_functions, 2), start=1):
            if len(function_group) > 1:
                service_text = f"The Registrar's Office {function_group[0].lower()} and {function_group[1].lower()}."
            else:
                service_text = f"The Registrar's Office {function_group[0].lower()}."
            add_record(
                records,
                seen,
                f"Registrar Services - {index}",
                service_text,
                url,
                "services",
                "registrar",
                "registration",
                "grades",
            )

    if re.search(r"939 Main Street, Room 305", blob, re.IGNORECASE):
        add_record(
            records,
            seen,
            "Registrar Contact",
            "The Registrar's Office is located at 939 Main Street, Room 305, Worcester, MA 01610. Call 1-508-793-7426 or email registrar@clarku.edu.",
            url,
            "contact",
            "registrar",
            "contact",
        )

    if re.search(r"Office Hours:\s+Monday-Friday 9:30 am - 4:00 pm", blob, re.IGNORECASE):
        add_record(records, seen, "Registrar Office Hours", "Registrar office hours are Monday through Friday from 9:30 AM to 4:00 PM.", url, "hours", "registrar", "hours")

    quick_links = []
    quick_index = find_line_index(lines, r"Quick Links")
    if quick_index != -1:
        for line in lines[quick_index + 1 : quick_index + 10]:
            if re.search(r"Contact Information|Helpful Links", line, re.IGNORECASE):
                break
            if len(line) > 3 and "Image" not in line:
                quick_links.append(line)
    if quick_links:
        add_record(
            records,
            seen,
            "Registrar Quick Links",
            f"Clark highlights quick links for {', '.join(quick_links[:4])}, transcripts, and the academic catalog on the Registrar page.",
            url,
            "services",
            "registrar",
            "quick links",
        )

    if len(records) < 3:
        raise RuntimeError(f"Parsed only {len(records)} registrar records")

    return records


def parse_huc_hours(records, seen, url, lines, section_pattern, center_title, desk_title):
    section_lines = collect_section(
        lines,
        section_pattern,
        [r"Thanksgiving Break", r"Fall and Spring Orientation Weeks", r"Summer Hours", r"Contact Information", r"Floor 1"],
        max_lines=10,
    )
    if not section_lines:
        return

    center_parts = []
    desk_parts = []
    for line in section_lines:
        if re.search(r"University Center Hours|UC Info Desk Hours", line, re.IGNORECASE):
            continue

        matched = re.match(
            r"^(.+?:\s*.+?)\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).+?:\s*.+)$",
            line,
            re.IGNORECASE,
        )
        if matched:
            center_parts.append(normalize_space(matched.group(1)))
            desk_parts.append(normalize_space(matched.group(2)))
            continue

        if re.search(r"Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday", line, re.IGNORECASE):
            center_parts.append(normalize_space(line))

    if center_parts and any(re.search(r"\d", part) for part in center_parts):
        add_record(records, seen, center_title, f"{center_title} are {' '.join(center_parts)}.", url, "hours", "higgins", "hours")
    if desk_parts and any(re.search(r"\d", part) for part in desk_parts):
        add_record(records, seen, desk_title, f"{desk_title} are {' '.join(desk_parts)}.", url, "hours", "higgins", "information desk", "hours")


def scrape_higgins_university_center(url):
    soup, _, final_url = fetch_soup(url)
    lines = collect_text_lines(soup)
    blob = "\n".join(lines)
    records = []
    seen = set()

    if "Higgins University Center" not in blob:
        linked_url = follow_official_link(soup, final_url, r"higgins-university-center")
        if linked_url and linked_url != final_url:
            soup, _, _ = fetch_soup(linked_url)
            lines = collect_text_lines(soup)
            blob = "\n".join(lines)

    overview_match = re.search(
        r"The Higgins University Center is a four-story campus union building.+?visitors\.",
        blob,
        re.IGNORECASE,
    )
    if overview_match:
        add_record(records, seen, "Higgins University Center Overview", overview_match.group(0), url, "building", "higgins", "student union")

    for floor_name in ["Ground Floor (basement)", "Floor 1", "Floor 2", "Floor 3"]:
        floor_lines = collect_section(
            lines,
            re.escape(floor_name),
            [r"Floor 1", r"Floor 2", r"Floor 3", r"University Center and Information Desk Hours of Operation", r"Academic Year", r"Contact Information"],
            max_lines=8,
        )
        if floor_lines:
            add_record(
                records,
                seen,
                f"Higgins University Center - {floor_name}",
                f"{floor_name} includes {' '.join(floor_lines)}.",
                url,
                "services",
                "higgins",
                floor_name,
            )

    parse_huc_hours(records, seen, url, lines, r"Academic Year", "Higgins University Center Hours - Academic Year", "Higgins Information Desk Hours - Academic Year")
    parse_huc_hours(records, seen, url, lines, r"Summer Hours", "Higgins University Center Hours - Summer", "Higgins Information Desk Hours - Summer")

    if re.search(r"Higgins University Center\s+3rd Floor, Asher Suite\s+950 Main Street", blob, re.IGNORECASE):
        add_record(
            records,
            seen,
            "Higgins University Center Contact",
            "Student Leadership and Programming is located in Higgins University Center, 3rd Floor, Asher Suite, 950 Main Street, Worcester, MA 01610. Call 1-508-793-7549.",
            url,
            "contact",
            "higgins",
            "contact",
        )

    if not any(record["title"].startswith("Higgins University Center Hours") for record in records):
        raise RuntimeError("Higgins hours could not be parsed cleanly")

    if len(records) < 4:
        raise RuntimeError(f"Parsed only {len(records)} HUC records")

    return records


def scrape_campus_map(url):
    soup, _, _ = fetch_soup(url)
    lines = collect_text_lines(soup)
    records = []
    seen = set()

    if find_line_index(lines, r"Download a printable campus map") != -1:
        add_record(records, seen, "Campus Map Download", "Clark's campus map page includes a downloadable printable campus map for students and visitors.", url, "map", "campus map", "download")

    popular_spots = collect_section(lines, r"Popular spots on campus", [r"Visitor parking", r"Admission Tours"], max_lines=6)
    for spot in popular_spots[:4]:
        add_record(records, seen, f"Campus Map - {spot}", f"{spot} is highlighted as a popular spot on Clark's campus map.", url, "building", "campus map", spot)

    visitor_parking = collect_section(lines, r"Visitor parking", [r"Admission Tours", r"Help us provide"], max_lines=4)
    if visitor_parking:
        add_record(
            records,
            seen,
            "Visitor Parking",
            "Clark's campus map page links visitors to official parking information before they arrive on campus.",
            url,
            "parking",
            "visitor parking",
            "map",
        )

    add_record(records, seen, "Clark Main Campus Address", "Clark University's main campus address is 950 Main St, Worcester, MA 01610.", url, "contact", "address", "campus")

    if len(records) < 3:
        raise RuntimeError(f"Parsed only {len(records)} campus map records")

    return records


def scrape_public_safety(url):
    soup, _, final_url = fetch_soup(url)
    lines = collect_text_lines(soup)
    blob = "\n".join(lines)
    records = []
    seen = set()

    if "University Police" not in blob and "Public Safety" not in blob:
        linked_url = follow_official_link(soup, final_url, r"(university-police|emergency-management-and-campus-assistance)")
        if linked_url:
            soup, _, _ = fetch_soup(linked_url)
            lines = collect_text_lines(soup)
            blob = "\n".join(lines)

    if re.search(r"CUPD operates 24/7, 365 days/year\.", blob, re.IGNORECASE):
        add_record(records, seen, "University Police Availability", "Clark University Police operates 24 hours a day, 365 days a year.", url, "hours", "public safety", "24/7")

    if re.search(r"University Police\s+1-508-793-7575", blob, re.IGNORECASE):
        add_record(records, seen, "Public Safety Emergency Number", "For an emergency on campus, call University Police at 1-508-793-7575 or use any emergency phone on campus.", url, "emergency", "public safety", "emergency")

    if re.search(r"Campus Ambassadors\s+1-508-450-5584\s+7 Days a week: 7 a.m. - 9 p.m.", blob, re.IGNORECASE):
        add_record(records, seen, "Campus Ambassadors", "Campus Ambassadors can be reached at 1-508-450-5584 and are available seven days a week from 7:00 AM to 9:00 PM.", url, "contact", "campus ambassadors", "escort")

    if re.search(r"University Police\s+Bullock Hall, Basement", blob, re.IGNORECASE):
        add_record(records, seen, "Public Safety Location", "University Police and campus safety operations are based in Bullock Hall, Basement.", url, "building", "public safety", "bullock hall")

    if len(records) < 3:
        raise RuntimeError(f"Parsed only {len(records)} public safety records")

    return records


def scrape_academic_calendar(url):
    soup, _, final_url = fetch_soup(url)
    lines = collect_text_lines(soup)
    blob = "\n".join(lines)

    if "Academic Year 2025-2026" not in blob:
        linked_url = follow_official_link(soup, final_url, r"academic-calendars")
        if not linked_url:
            linked_url = "https://www.clarku.edu/offices/registrar/academic-calendars/"
        soup, _, _ = fetch_soup(linked_url)
        lines = collect_text_lines(soup)
        blob = "\n".join(lines)

    records = []
    seen = set()
    patterns = [
        (
            "Academic Calendar - Fall 2025 Classes Begin",
            r"Fall 2025\s+Aug\. 25\s+First day of classes Full and 1st Module",
            "For academic year 2025-2026, Clark's Fall 2025 semester begins on August 25, 2025.",
        ),
        (
            "Academic Calendar - Fall 2025 Breaks",
            r"Oct\. 13-14\s+Fall Break\s*[-–]\s*no classes",
            "For Fall 2025, Clark lists Fall Break on October 13-14, 2025 and Thanksgiving Break on November 26-28, 2025.",
        ),
        (
            "Academic Calendar - Fall 2025 Final Exams",
            r"Dec\. 11, 12, 15, 16\s+Final Exams",
            "Clark lists Fall 2025 final exams on December 11, 12, 15, and 16, 2025.",
        ),
        (
            "Academic Calendar - Spring 2026 Classes Begin",
            r"Spring 2026\s+Jan\. 12\s+First day of classes Full and 1st Module",
            "For academic year 2025-2026, Clark's Spring 2026 semester begins on January 12, 2026.",
        ),
        (
            "Academic Calendar - Spring 2026 Break",
            r"March 2-6\s+Spring break\s*[-–]\s*no classes",
            "Clark's Spring 2026 break runs from March 2 through March 6, 2026.",
        ),
        (
            "Academic Calendar - Commencement",
            r"Mon May 18\s+Commencement",
            "Clark's 2026 commencement is scheduled for Monday, May 18, 2026.",
        ),
    ]

    for title, pattern, content in patterns:
        if re.search(pattern, blob, re.IGNORECASE):
            add_record(records, seen, title, content, url, "academic_calendar", "calendar", "academic")

    if len(records) < 4:
        raise RuntimeError(f"Parsed only {len(records)} academic calendar records")

    return records


def scrape_dining(url):
    soup, _, _ = fetch_soup(url)
    records = []
    seen = set()
    generic_items = {
        "menus & hours",
        "kosher dining",
        "halal dining",
        "locations",
        "meal plans",
        "our story",
        "meet our team",
        "sustainability",
        "to go boxes",
        "health & wellbeing",
        "menu commitments & allergen information",
        "disclaimer",
    }

    title_node = soup.find("title")
    title = normalize_space(title_node.get_text(" ", strip=True).split("-")[0]) if title_node else "The Table at Higgins"

    overview_match = soup.find(string=re.compile(r"all you care to eat|all-you-care-to-eat", re.IGNORECASE))
    if overview_match and overview_match.parent:
        add_record(
            records,
            seen,
            "The Table at Higgins Overview",
            normalize_space(overview_match.parent.get_text(" ", strip=True)),
            url,
            "dining",
            "higgins",
            "dining hall",
        )

    meal_labels = []
    for heading in soup.find_all(["h1", "h2", "h3"]):
        text = normalize_space(heading.get_text(" ", strip=True))
        if re.search(r"breakfast|lunch|dinner|brunch|hours|menu", text, re.IGNORECASE):
            meal_labels.append(text)
    meal_labels = list(OrderedDict.fromkeys(meal_labels))
    if meal_labels:
        add_record(
            records,
            seen,
            "The Table at Higgins Service Categories",
            f"The Table at Higgins currently highlights these service categories: {', '.join(meal_labels[:6])}.",
            url,
            "dining",
            "menu",
            "hours",
        )

    items = []
    for item in soup.select(".menu-item-li a.show-nutrition, [class*='menu-item'] a, [class*='item-name']"):
        text = normalize_space(item.get_text(" ", strip=True))
        if text and len(text) < 80:
            items.append(text)
    unique_items = list(OrderedDict.fromkeys(items))
    if unique_items and all(item.lower() in generic_items for item in unique_items[: min(len(unique_items), 8)]):
        raise RuntimeError("Dining page content is too generic for useful menu facts")
    for index, item_group in enumerate(chunk_list(unique_items[:12], 4), start=1):
        if len(item_group) > 1:
            content = f"Current menu highlights at The Table at Higgins include {', '.join(item_group[:-1])}, and {item_group[-1]}."
        else:
            content = f"Current menu highlight at The Table at Higgins is {item_group[0]}."
        add_record(records, seen, f"The Table at Higgins Menu Highlights - {index}", content, url, "dining", "menu", "higgins")

    info_panels = []
    for panel in soup.select("[class*='hours'], [class*='location'], [class*='details']"):
        text = normalize_space(panel.get_text(" ", strip=True))
        if "{" in text:
            continue
        if 25 <= len(text) <= 180 and re.search(r"hours|open|closed|location|center|hall", text, re.IGNORECASE):
            info_panels.append(text)
    for panel in list(OrderedDict.fromkeys(info_panels))[:3]:
        add_record(records, seen, "The Table at Higgins Details", panel, url, "dining", "hours", "location")

    if len(records) < 3:
        raise RuntimeError(f"Parsed only {len(records)} dining records")

    return records


SCRAPERS = {
    "academic_calendar": scrape_academic_calendar,
    "athletics_hours": scrape_athletics_hours,
    "campus_map": scrape_campus_map,
    "dining": scrape_dining,
    "health_services": scrape_health_services,
    "higgins_university_center": scrape_higgins_university_center,
    "its_help": scrape_its_help,
    "libcal_hours": scrape_libcal_hours,
    "public_safety": scrape_public_safety,
    "registrar": scrape_registrar,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--parser", required=True, choices=SCRAPERS.keys())
    args = parser.parse_args()

    records = SCRAPERS[args.parser](args.url)
    print(json.dumps(records, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        warn(f"[seed-helper] {exc}")
        sys.exit(1)
