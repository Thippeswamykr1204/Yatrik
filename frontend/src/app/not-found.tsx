import { ErrorPanel } from "@/components/studio/States";
export default function NotFound() {
  return (
    <div className="shell">
      <ErrorPanel
        title="A little off the map."
        message="This page isn’t here. But there are plenty of good places left to discover."
      />
    </div>
  );
}
