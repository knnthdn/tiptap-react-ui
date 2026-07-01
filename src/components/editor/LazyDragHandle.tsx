import { lazy, Suspense, type ComponentProps } from "react";

const DragHandle = lazy(() => import("@tiptap/extension-drag-handle-react"));

type LazyDragHandleProps = ComponentProps<typeof DragHandle>;

export default function LazyDragHandle(props: LazyDragHandleProps) {
  return (
    <Suspense fallback={null}>
      <DragHandle {...props} />
    </Suspense>
  );
}