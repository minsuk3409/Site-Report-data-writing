/* 화면 구조 검토용. 모든 예시 자료는 가상이며 네트워크 요청을 하지 않습니다. */
const types = ['안전보건심사', '안전보건심층진단', '온열질환 모니터링', '한랭질환 모니터링'];
const examples = [
  { id: 'DEMO-001', site: '가상현장 A · 업무시설', type: 0, date: '2026-10-14', author: '담당자 A', status: '분석 검토', file: '가상현장A_보건체크리스트.xlsx' },
  { id: 'DEMO-002', site: '가상현장 B · 공동주택', type: 1, date: '2026-10-12', author: '담당자 B', status: '초안 작성', file: '가상현장B_심층진단.hwpx' },
  { id: 'DEMO-003', site: '가상현장 C · 물류시설', type: 2, date: '2026-08-20', author: '담당자 A', status: '최종 확정', file: '가상현장C_온열체크리스트.xlsx' },
  { id: 'DEMO-004', site: '가상현장 A · 업무시설', type: 3, date: '2026-01-21', author: '담당자 B', status: '최종 확정', file: '가상현장A_한랭체크리스트.hwp' },
];
const state = { type: 'all', selected: examples[0], confirmed: false, draft: '', health: '', files: [] };
const app = document.querySelector('#app');
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  folder: '<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 10h18"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
  document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 12h8M8 16h6"/>',
  building: '<path d="M4 21V5l8-3v19M12 8h8v13M2 21h20M8 7v1m0 3v1m0 3v1m8-4v1m0 3v1"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  check: '<path d="m8 12 3 3 6-7"/><rect x="3" y="3" width="18" height="18" rx="5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h.01m4 0h.01"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  snow: '<path d="M12 2v20M3.4 7l17.2 10M3.4 17 20.6 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4m10 14-1-4 4-1M4 14l4 1-1 4m10-14-1 4 4 1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.document}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const typeOptions = (all = true) => `${all ? '<option value="all">모든 점검 종류</option>' : ''}${types.map((t, i) => `<option value="${i}" ${String(state.type) === String(i) ? 'selected' : ''}>${t}</option>`).join('')}`;
const selectedRows = () => examples.filter(r => state.type === 'all' || String(r.type) === state.type);
const heading = (title, description) => `<div class="page-heading"><div><p class="eyebrow">HEALTH & SAFETY WORKSPACE</p><h1>${title}<span class="title-dot" aria-hidden="true">.</span></h1><p>${description}</p></div><a class="primary heading-action" href="#upload">＋ 체크리스트 등록</a></div>`;
const steps = current => `<ol class="steps" aria-label="보고서 작성 단계">${['자료 등록', '분석 검토', '보고서 편집'].map((s, i) => `<li ${i === current ? 'aria-current="step"' : ''}>${s}</li>`).join('')}</ol>`;
const statusClass = status => status === '최종 확정' ? 'complete' : status === '분석 검토' ? 'review' : 'draft';
const table = rows => `<div class="table-wrap"><table><thead><tr><th scope="col">현장명</th><th scope="col">점검 종류</th><th scope="col">점검일</th><th scope="col">담당자</th><th scope="col">진행 상태</th><th scope="col">열기</th></tr></thead><tbody>${rows.map(r => `<tr><td><div class="site-cell"><span class="site-icon">${icon('building')}</span><span><strong>${escapeHtml(r.site)}</strong><small>${r.id}</small></span></div></td><td><span class="type-label type-${r.type}"><i></i>${types[r.type]}</span></td><td class="date-cell">${r.date}</td><td>${escapeHtml(r.author)}</td><td><span class="badge ${statusClass(r.status)}">${r.status}</span></td><td><button class="table-action" type="button" data-open="${r.id}">${r.status === '분석 검토' ? '내용 검토' : '보고서 보기'} <span aria-hidden="true">↗</span></button></td></tr>`).join('') || '<tr><td colspan="6" class="empty-state">조건에 맞는 점검이 없습니다.<small>검색어나 필터를 변경해 보세요.</small></td></tr>'}</tbody></table></div>`;

function dashboard() {
  const rows = selectedRows();
  const done = rows.filter(r => r.status === '최종 확정').length;
  return `${heading('전체 현황', '점검 종류별 진행 상황과 보고서 작성 현황을 확인합니다.')}
    <div class="dashboard-filters"><div class="category-tabs" role="group" aria-label="점검 종류 선택">${['전체', ...types].map((t,i) => `<button data-category="${i === 0 ? 'all' : i - 1}" aria-pressed="${state.type === (i === 0 ? 'all' : String(i - 1))}">${t}</button>`).join('')}</div><div class="period">${icon('calendar')}<span>2026년 전체</span><small>01.01 – 12.31</small></div></div>
    <section class="stats" aria-label="점검 현황">${[
      ['등록된 점검', rows.length, '건', '점검 1회 기준', 'document', 'green'],
      ['점검 현장', new Set(rows.map(r => r.site)).size, '개', '중복 현장 제외', 'building', 'blue'],
      ['작성·검토 중', rows.length - done, '건', '담당자 확인 필요', 'clock', 'amber'],
      ['최종 확정', done, '건', '검토를 마친 보고서', 'check', 'green'],
    ].map(([label, value, unit, hint, glyph, color]) => `<article><div class="stat-top"><h2>${label}</h2><span class="stat-icon ${color}">${icon(glyph)}</span></div><strong>${String(value).padStart(2,'0')}<small>${unit}</small></strong><p><span class="stat-indicator ${color}"></span>${hint}</p></article>`).join('')}</section>
    <div class="dashboard-grid"><section class="panel category-panel"><div class="section-heading"><div><h2>점검 종류별 현황</h2><p>점검 유형별 보고서 작성 상태를 확인하세요.</p></div><span class="subtle-tag">${rows.length}건의 점검</span></div><div class="category-rows">${types.map((t, i) => { const group = rows.filter(r => r.type === i); const completed = group.filter(r => r.status === '최종 확정').length; return `<div class="category-row type-${i}"><span class="category-icon">${icon(['shield','layers','sun','snow'][i])}</span><div class="category-content"><div><h3>${t}</h3><strong>${group.length}<small>건</small></strong></div><div class="progress-track" role="img" aria-label="${t}: 최종 확정 ${completed}건, 작성·검토 ${group.length-completed}건"><span class="progress-complete" style="width:${group.length ? completed / group.length * 100 : 0}%"></span><span class="progress-pending" style="width:${group.length ? (group.length - completed) / group.length * 100 : 0}%"></span></div><p>최종 확정 ${completed}<span>작성·검토 ${group.length - completed}</span></p></div></div>`; }).join('')}</div><div class="chart-legend"><span><i class="legend-complete"></i>최종 확정</span><span><i class="legend-pending"></i>작성·검토</span><small>필터에 해당하는 가상 데이터 기준</small></div></section>
    <section class="panel workflow-panel"><div class="section-heading"><div><h2>보고서 작성 현황</h2><p>등록된 점검의 최종 확정 비율</p></div>${icon('document')}</div><div class="completion"><div class="donut" style="--completion:${rows.length ? Math.round(done / rows.length * 100) : 0}%" role="img" aria-label="최종 확정 ${rows.length ? Math.round(done / rows.length * 100) : 0}%"><div><strong>${rows.length ? Math.round(done / rows.length * 100) : 0}<small>%</small></strong><span>최종 확정</span></div></div><div class="completion-labels"><p><i class="legend-complete"></i>최종 확정<strong>${done}건</strong></p><p><i class="legend-pending"></i>작성·검토<strong>${rows.length-done}건</strong></p></div></div><div class="review-summary"><span class="stat-icon amber">${icon('clock')}</span><div><strong>이어서 작성할 보고서 <b>${rows.length - done}건</b></strong><p>검토 중인 내용을 확인해 주세요.</p></div><a href="#inspections" aria-label="작성 중인 보고서 목록 보기">${icon('arrow')}</a></div><a class="workflow-link" href="#upload">새 체크리스트로 보고서 시작하기 ${icon('arrow')}</a></section></div>
    <section class="panel recent-panel"><div class="section-heading"><div><h2>최근 점검 <span class="count-label">${rows.length}</span></h2><p>현장별 점검 결과와 보고서를 이어서 확인하세요.</p></div><a href="#inspections">전체 목록 ${icon('arrow')}</a></div>${table([...rows].sort((a,b) => b.date.localeCompare(a.date)))}</section>
    <aside class="info-line">${icon('info')}<p>동일 점검의 체크리스트와 보고서는 하나로 집계합니다. 미확인 항목은 확정된 지적사항에 포함하지 않습니다.</p></aside>`;
}

function inspections() {
  return `${heading('점검·보고서 목록', '자료 등록부터 최종보고서 작성까지 현장별로 이어서 작업합니다.')}<div class="toolbar"><label>현장 검색 <input id="site-search" type="search" placeholder="현장명 검색"></label><label>점검 종류 <select id="type-filter">${typeOptions()}</select></label><label>진행 상태 <select id="status-filter"><option>전체 상태</option><option>분석 검토</option><option>초안 작성</option><option>최종 확정</option></select></label><a class="primary" href="#upload">＋ 새 점검 등록</a></div><section class="panel" id="list-results">${table(selectedRows())}</section>`;
}

function upload() {
  return `${heading('체크리스트 등록', '점검 종류별 기존 양식을 그대로 등록하는 화면입니다.')}${steps(0)}<div class="split"><form id="upload-form" class="panel"><h2>점검 기본정보</h2><label>점검 종류 <select name="type" required>${typeOptions(false)}</select></label><label>현장명 <input name="site" required placeholder="예: 가상현장 A" maxlength="100"></label><div class="form-row"><label>점검일 <input name="date" type="date" required></label><label>점검 담당자 <input name="author" required maxlength="50" placeholder="담당자 이름"></label></div><h2>원본 체크리스트</h2><label class="file-area">파일 선택 · 여러 파일 가능<input name="files" id="files" type="file" multiple accept=".xlsx,.xls,.hwp,.hwpx,.ppt,.pptx,.pdf"></label><p>Excel · HWP/HWPX · PPT/PPTX · PDF</p><ul id="file-list"></ul><p class="notice">시안에서는 파일명만 표시합니다. 파일 내용을 읽거나 전송하지 않습니다. 다음 화면의 분석 결과는 가상 예시입니다.</p><button class="primary" type="submit">가상 분석 흐름 확인 →</button><p id="upload-error" role="alert"></p></form><aside class="panel"><h2>등록부터 보고서까지</h2><ol><li>점검 종류에 맞는 체크리스트 등록</li><li>추출 내용과 원본 근거 대조</li><li>누락·판독 불가 항목 확인</li><li>공통 양식으로 초안 작성</li><li>담당자 검토 후 최종 확정</li></ol><button type="button" id="sample">파일 없이 가상 예시 살펴보기 →</button></aside></div>`;
}

function analysis() {
  const r = state.selected;
  return `${heading('분석 내용 검토', `${escapeHtml(r.site)} · ${types[r.type]} · ${r.date}`)}${steps(1)}<p class="notice">가상 분석 예시입니다. 실제 파일을 판독한 결과가 아닙니다.</p><div class="split"><section class="panel"><h2>원본 근거</h2><p>${escapeHtml(r.file)}</p><div class="source-example"><h3>체크리스트 기재 내용 예시</h3><table><thead><tr><th>항목</th><th>기록</th></tr></thead><tbody><tr><td>휴게시설</td><td>휴게시설 운영 확인. 일부 청소 점검 기록 누락.</td></tr><tr><td>건강관리</td><td>건강관리 관련 자료 확인. 후속 관리 기록 일부 미첨부.</td></tr><tr><td>교육 기록</td><td>해당 칸 미기재.</td></tr></tbody></table></div><p>실제 구현에서는 페이지·시트·셀 위치와 원본 미리보기를 연결합니다.</p></section><form id="review-form" class="panel"><h2>추출·정리 내용</h2><label>휴게시설 · 개선 필요<textarea name="finding">${escapeHtml(state.draft || '휴게시설 운영은 확인되었으나, 일부 청소 점검 기록을 보완할 필요가 있음.')}</textarea></label><label>건강관리 · 추가 자료 확인<textarea name="health">${escapeHtml(state.health || '후속 관리 기록이 일부 첨부되지 않아 추가 확인이 필요함.')}</textarea></label><div class="notice"><strong>확인 필요 · 교육 기록 미기재</strong><p>미기재 항목은 적합 또는 부적합으로 판단하지 않습니다.</p></div><label class="checkbox"><input type="checkbox" id="review-confirm" ${state.confirmed ? 'checked' : ''} required>가상 원문과 정리 내용을 대조했습니다.</label><button class="primary" type="submit">공통 양식 보고서 초안 확인 →</button></form></div>`;
}

function reportText() {
  const r = state.selected;
  return `보건 점검 결과보고서 (가상 예시)\n\n1. 점검 개요\n현장명: ${r.site}\n점검 종류: ${types[r.type]}\n점검일: ${r.date}\n점검 담당자: ${r.author}\n\n2. 종합 의견\n제공된 자료 범위에서 보건관리 현황을 확인하였음. 일부 관리 기록 보완 및 추가 자료 확인이 필요함. 미기재 항목은 판단을 유보함.\n\n3. 항목별 점검 결과\n${state.draft || '휴게시설 운영은 확인되었으나, 일부 청소 점검 기록을 보완할 필요가 있음.'}\n건강관리: ${state.health || '후속 관리 기록이 일부 미첨부되어 추가 확인 필요.'}\n교육 기록: 체크리스트 미기재로 판단 유보.\n\n4. 주요 지적사항 및 개선 권고\n누락된 관리 기록을 보완하고 후속 관리 자료를 확인할 것을 권고함.\n\n5. 확인 필요 사항\n교육 실시 기록 및 건강관리 후속 관리 자료 확인 필요.\n\n6. 첨부자료\n${r.file}\n\n※ 화면 설계 검토용 가상 보고서이며 실제 점검 판단 또는 결재용 문서가 아닙니다.`;
}

function report() {
  return `${heading('최종보고서 편집', '모든 점검 종류에 같은 목차를 적용하고, 담당자가 내용을 검토합니다.')}${steps(2)}<div class="toolbar"><span class="badge">가상 초안 · 자동 저장되지 않음</span><button id="preview" type="button">미리보기</button><button id="download" type="button">텍스트 초안 내려받기</button></div><div class="report-layout"><aside class="panel"><h2>공통 보고서 목차</h2><ol><li>점검 개요</li><li>종합 의견</li><li>항목별 점검 결과</li><li>주요 지적사항 및 개선 권고</li><li>확인 필요 사항</li><li>첨부자료</li></ol><p>편집 내용은 현재 화면에서만 유지됩니다. PDF·한글 출력 및 최종 확정 기능은 추후 구현합니다.</p><a href="#analysis">← 원본 근거 다시 확인</a></aside><section class="panel paper"><label for="report-editor"><h2>보건 점검 결과보고서</h2></label><textarea id="report-editor" rows="32">${escapeHtml(state.report ?? reportText())}</textarea><pre id="report-preview" hidden></pre></section></div>`;
}

function template() {
  return `${heading('공통 보고서 양식', '입력 체크리스트는 종류별로, 출력 보고서는 하나의 공통 구조로 구성합니다.')}<section class="panel"><h2>서로 다른 체크리스트 → 하나의 보고서 구조</h2><div class="category-grid">${types.map(t => `<article><h3>${t}</h3><p>기존 체크리스트 양식 유지</p></article>`).join('')}</div><ol class="template-outline">${['점검 개요|현장명, 점검 종류, 점검일, 점검자, 자료 범위', '종합 의견|확인된 사실을 근거로 현장 상태와 우선 개선사항 정리', '항목별 점검 결과|점검 종류에 맞는 세부 항목과 원본 근거', '주요 지적사항 및 개선 권고|확인된 문제와 개선 방향', '확인 필요 사항|미기재, 판독 불가, 추가 자료 요청', '첨부자료|원본 체크리스트와 사진 등 근거 자료'].map(s => { const [title, body] = s.split('|'); return `<li><h3>${title}</h3><p>${body}</p></li>`; }).join('')}</ol><p class="notice">회사 양식과 실제 샘플을 확인하기 전의 제안입니다. 공통 점수·등급·법규 위반 판단은 임의로 부여하지 않습니다.</p><a class="primary" href="#report">공통 양식 보고서 예시 보기 →</a></section>`;
}

function render() {
  const route = location.hash.slice(1) || 'dashboard';
  const pages = { dashboard, inspections, upload, analysis, report, template };
  app.dataset.view = pages[route] ? route : 'dashboard';
  app.innerHTML = (pages[route] || dashboard)();
  document.querySelector('#breadcrumb-page').textContent = app.querySelector('h1').textContent.replace(/\.$/, '');
  const navRoute = ['analysis', 'report'].includes(route) ? 'inspections' : app.dataset.view;
  document.querySelectorAll('.sidebar nav a').forEach(a => { if (a.hash === `#${navRoute}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  bind();
}
function updateList() {
  const query = document.querySelector('#site-search').value.trim();
  const status = document.querySelector('#status-filter').value;
  document.querySelector('#list-results').innerHTML = table(selectedRows().filter(r => r.site.includes(query) && (status === '전체 상태' || r.status === status)));
}
function bind() {
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { state.type = button.dataset.category; render(); }));
  document.querySelector('#type-filter')?.addEventListener('change', e => { state.type = e.target.value; if (location.hash === '#inspections') updateList(); else render(); });
  document.querySelector('#site-search')?.addEventListener('input', updateList);
  document.querySelector('#status-filter')?.addEventListener('change', updateList);
  document.querySelector('#sample')?.addEventListener('click', () => { state.selected = examples[0]; state.confirmed = false; state.draft = ''; state.health = ''; state.report = undefined; location.hash = 'analysis'; });
  document.querySelector('#files')?.addEventListener('change', e => { state.files = [...e.target.files]; document.querySelector('#file-list').innerHTML = state.files.map(f => `<li>${escapeHtml(f.name)}</li>`).join(''); });
  document.querySelector('#upload-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.target);
    const files = [...document.querySelector('#files').files];
    if (!files.length || files.some(f => !/\.(xlsx?|hwpx?|pptx?|pdf)$/i.test(f.name))) { document.querySelector('#upload-error').textContent = '지원 형식의 체크리스트 파일을 선택해 주세요.'; return; }
    state.selected = { site: form.get('site'), type: Number(form.get('type')), date: form.get('date'), author: form.get('author'), file: files.map(f => f.name).join(', ') };
    state.confirmed = false; state.draft = ''; state.health = ''; state.report = undefined; location.hash = 'analysis';
  });
  document.querySelector('#review-form')?.addEventListener('submit', e => { e.preventDefault(); const form = new FormData(e.target); state.confirmed = true; state.draft = form.get('finding'); state.health = form.get('health'); state.report = undefined; location.hash = 'report'; });
  document.querySelector('#report-editor')?.addEventListener('input', e => { state.report = e.target.value; });
  document.querySelector('#preview')?.addEventListener('click', e => { const editor = document.querySelector('#report-editor'); const preview = document.querySelector('#report-preview'); preview.textContent = editor.value; editor.hidden = !editor.hidden; preview.hidden = !editor.hidden; e.target.textContent = editor.hidden ? '편집으로 돌아가기' : '미리보기'; });
  document.querySelector('#download')?.addEventListener('click', () => { const blob = new Blob([document.querySelector('#report-editor').value], {type: 'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '보건점검보고서_가상초안.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
}
app.addEventListener('click', e => { const button = e.target.closest('[data-open]'); if (button) { state.selected = examples.find(r => r.id === button.dataset.open); state.report = undefined; state.draft = ''; state.health = ''; state.confirmed = false; location.hash = state.selected.status === '분석 검토' ? 'analysis' : 'report'; } });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
render();
