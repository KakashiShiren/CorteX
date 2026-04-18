import { Student } from "@/lib/types";
import { StudentCard } from "@/components/people/student-card";

export function StudentGrid({ students }: { students: Student[] }) {
  if (!students.length) {
    return (
      <div className="cortex-panel p-10 text-center">
        <div className="text-2xl font-semibold">No matching students</div>
        <p className="mt-3 text-sm text-black/56 dark:text-white/58">
          Try a broader query or clear one of the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
