export type PrototypeTestStage =
  | "functional"
  | "usability"
  | "acceptance"
  | "regression";

export interface PrototypeUserScenario {
  id: string;
  stage: PrototypeTestStage;
  actor: "tenant" | "broker";
  route: string;
  task: string;
  oracle: string[];
}

export const prototypeUserScenarios: PrototypeUserScenario[] = [
  {
    id: "UT-HOME-SEARCH-ROOM0",
    stage: "functional",
    actor: "tenant",
    route: "/home",
    task: "상도 또는 원룸 키워드로 상도역 원룸 매물을 찾는다.",
    oracle: [
      "검색 결과 수가 표시된다.",
      "상도역 원룸의 월세 500/31 정보가 보인다.",
      "검색어와 무관한 매물은 줄어든다.",
    ],
  },
  {
    id: "UT-DETAIL-VIEWER-ENTRY",
    stage: "acceptance",
    actor: "tenant",
    route: "/listing/rec-1",
    task: "매물 상세에서 3D 공간 보기로 진입한다.",
    oracle: [
      "상세 화면은 가격 정보와 상세 정보를 보여준다.",
      "3D 공간 보기 조작이 /viewer?listing=rec-1로 연결된다.",
    ],
  },
  {
    id: "UT-CHAT-INQUIRY",
    stage: "usability",
    actor: "tenant",
    route: "/chat",
    task: "채팅 목록에서 매물을 선택하고 문의 메시지를 보낸다.",
    oracle: [
      "채팅 목록과 대화방이 분리되어 보인다.",
      "전송한 메시지가 내 말풍선으로 남는다.",
      "뒤로가기로 채팅 목록에 복귀할 수 있다.",
    ],
  },
  {
    id: "UT-BROKER-REGISTER-DRAFT",
    stage: "functional",
    actor: "broker",
    route: "/listing/new",
    task: "중개인이 신규 매물을 등록한다.",
    oracle: [
      "주소, 가격, 면적, 입주 가능일을 편집할 수 있다.",
      "옵션 선택이 유지된다.",
      "제출 후 등록 완료 안내가 나온다.",
    ],
  },
  {
    id: "UT-MYPAGE-BROKER-FLOW",
    stage: "regression",
    actor: "broker",
    route: "/mypage",
    task: "마이페이지에서 인증 상태와 인증 후 내 매물 관리 흐름을 확인한다.",
    oracle: [
      "기본 메뉴는 모든 사용자에게 동일하게 보인다.",
      "인증 상태는 별도 메뉴가 아니라 상태 카드에 표시된다.",
      "인증 전에는 매물 등록과 내 매물 관리 진입점이 보이지 않는다.",
      "인증 후에는 내가 올린 매물이 상단 가로 목록으로 보인다.",
    ],
  },
];

export function getPrototypeUserScenario(id: string) {
  return prototypeUserScenarios.find((scenario) => scenario.id === id);
}
