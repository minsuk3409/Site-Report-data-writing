# 기존 HTML 기반 소스 복원 및 검수

검수일: 2026-10-23

## 복원 기준

기존 GitHub 커밋 `e9cf52f`의 `health-inspection-preview.html`을 기준으로 저장소 루트에 `index.html`, `styles.css`, `app.js`를 구성했습니다. 기존 디자인·문구·가상 데이터 및 화면 동작을 유지했습니다.

기준 HTML SHA-256:

```text
6239288ea63701651d37edc3a68973c61923f36db70f884c5ff314591c675344
```

복원 후에도 기준 HTML의 바이트와 SHA-256이 동일합니다. 기존 HTML과 PNG 3개에 실행·수정 가능한 분리 소스, 재생성 도구 및 검수 코드를 추가했습니다.

## 코드 관리

루트의 소스 세 파일을 편집한 뒤 `npm run build`로 단일 HTML을 생성합니다. `npm run check`는 JavaScript 구문과 단일 HTML·분리 소스의 동기화 여부를 검사합니다.

## 검수 결과

- Chromium에서 1440×1000, 390×844 크기로 6개 화면 검수
- 대시보드·목록·등록·분석 검토·보고서 편집·공통 양식의 12개 화면 비교에서 기준 HTML과 픽셀 일치
- 페이지 전체의 가로 넘침 없음
- 점검 종류·현장명·진행 상태 필터 및 필터 결과의 보고서 열기 정상
- XLS·XLSX·HWP·HWPX·PPT·PPTX·PDF 선택 흐름 정상, 미지원 확장자 차단
- 원문 대조 확인 전 보고서 진행 차단
- 검토 내용의 보고서 반영, 수정·미리보기·화면 왕복 및 텍스트 다운로드 정상
- HTML 문법을 포함한 입력값의 텍스트 표시 확인
- 브라우저 오류 및 외부 통신 없음

실행한 명령:

```sh
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm test
```

브라우저 검수는 `tests/browser.mjs`로 재실행할 수 있습니다. 시스템 Chromium을 사용하는 경우 환경변수로 실행 파일을 지정하며, 기본 설정에서는 Playwright로 설치한 Chromium을 사용합니다.

현재 결과물은 가상 데이터 화면 시안입니다. 실제 문서 판독·AI 분석·서버 저장·HWP/PDF 출력 및 GitHub Pages 배포 설정은 별도 구현 범위입니다.
