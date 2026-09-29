

// 가로를 꽉 채운 선택 토글 — 안전 우선도·테마에 공용, 데스크탑 설정(App.jsx)도 같은 모양을 쓴다
export function ToggleGroup({ options, value, onChange, label }) {
  return (
    <div className="mfToggleGroup" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={value === o.key}
          className={value === o.key ? 'mfToggleGroupItem active' : 'mfToggleGroupItem'}
          onClick={() => onChange(o.key)}
        >
          <o.icon size={16} />
          {o.label}
        </button>
      ))}
    </div>
  );
}
