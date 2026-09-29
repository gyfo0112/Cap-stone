import { useState, useRef } from 'react';

// 하단시트 그랩핸들을 탭하거나 위/아래로 드래그해서 접고 펼치는 훅.
// 드래그로 이미 토글됐으면 뒤이어 발생하는 click은 무시해서 두 번 안 토글되게 한다.
export function useSheetToggle(initial = true) {
  const [expanded, setExpanded] = useState(initial);
  const dragStartY = useRef(null);
  const draggedRef = useRef(false);

  const onPointerDown = (e) => {
    dragStartY.current = e.clientY;
    draggedRef.current = false;
  };
  const onPointerMove = (e) => {
    if (dragStartY.current == null || draggedRef.current) return;
    const delta = e.clientY - dragStartY.current;
    if (delta < -30) {
      setExpanded(true);
      draggedRef.current = true;
    } else if (delta > 30) {
      setExpanded(false);
      draggedRef.current = true;
    }
  };
  const endDrag = () => {
    dragStartY.current = null;
  };
  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setExpanded((v) => !v);
  };

  return [
    expanded,
    { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onClick },
  ];
}
