import { TriangleAlert, X } from 'lucide-react';

const STATUS_TEXT = {
  loading: '범죄주의구간을 불러오는 중…',
  ok: '현재 지도 범위의 공공데이터 이미지를 불러왔어요.',
  'missing-key': '생활안전지도 인증키가 필요해요. frontend/.env.local에 SAFEMAP_SERVICE_KEY를 입력한 후 서버를 재시작해 주세요.',
  error: '범죄정보를 불러오지 못했어요. 인증키, 범죄주의구간(전체) 활용 승인, 인터넷 연결을 확인한 후 지도를 움직이거나 표시를 껐다 켜 주세요.',
  zoom: '범죄주의구간을 보려면 지도를 더 확대해 주세요.',
  outside: '국내 공공데이터 제공 범위 안으로 지도를 이동해 주세요.',
};

export function CrimeLayerScreen({ desktop = false, enabled, opacity, status, onEnabledChange, onOpacityChange, onClose }) {
  return (
    <section className={desktop ? 'crimePanelDesktop' : 'mfRouteScreen'} aria-label="범죄주의구간 설정">
      <div className="mfRouteSheet crimeSheet">
        {!desktop && <span className="mfGrabHandle" />}
        <div className="mfCrimeHeaderRow">
          <div className="mfCrimeTopIcon"><TriangleAlert size={18} /></div>
          <div className="mfCrimeTopText"><strong>범죄주의구간</strong><span>생활안전지도 · 경찰청 제공</span></div>
          <button className={enabled ? 'mfSwitch on' : 'mfSwitch'} onClick={() => onEnabledChange(!enabled)}
            role="switch" aria-checked={enabled} aria-label="범죄주의구간 표시"><span /></button>
          <button className="crimeClose" onClick={onClose} aria-label="범죄정보 설정 닫기"><X size={18} /></button>
        </div>
        <p className="crimeStatus" role="status">{enabled ? STATUS_TEXT[status] || STATUS_TEXT.loading : '범죄주의구간 표시가 꺼져 있어요.'}</p>
        <div className="mfSliderHeaderRow">
          <label className="mfSectionLabel" htmlFor="crime-opacity">범죄정보 진하기</label>
          <span className="mfSliderValue">{Math.round(opacity * 100)}%</span>
        </div>
        <input id="crime-opacity" type="range" min={0} max={100} value={Math.round(opacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          className="mfSlider mfSliderNeutral" disabled={!enabled} />
        <div className="crimeRiskLegend" role="img" aria-label="범죄주의구간 색상 안내: 연한 노랑은 안전, 가운데 주황은 주의, 진한 빨강은 위험">
          <div className="crimeRiskGradient" aria-hidden="true" />
          <div className="crimeRiskLabels" aria-hidden="true">
            <span>안전</span>
            <span>주의</span>
            <span>위험</span>
          </div>
        </div>
      </div>
    </section>
  );
}
