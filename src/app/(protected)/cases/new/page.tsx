import NewCaseForm from "@/components/new-case-form";

export default function NewCasePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">案件作成</h1>
      <NewCaseForm />
    </div>
  );
}
