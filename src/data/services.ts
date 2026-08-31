import img01 from "../assets/service/img-01.jpg";
import img02 from "../assets/service/img-02.jpg";
import img03 from "../assets/service/img-03.jpg";

export interface ServiceItem {
  titleLines: [string, string];
  image: string;
  description: string;
}

export const services: ServiceItem[] = [
  {
    titleLines: ["Concept", "Strategy"],
    image: img01,
    description:
      "디자인 이전에, ‘무엇을 왜 만드는가’를 가장 먼저 고민합니다. 브랜드의 본질과 목표를 이해하고, 사용자의 행동과 감정 흐름을 고려한 기획과 스토리 구조를 설계합니다. 모든 프로젝트는 이 과정을 통해 의미 있는 방향성을 갖게 됩니다.",
  },
  {
    titleLines: ["Website", "Design"],
    image: img02,
    description:
      "사용자의 경험과 감정을 중심에 두고, 브랜드의 메시지가 명확히 전달되는 직관적이고 감성적인 웹디자인을 만듭니다. 단순히 ‘보여주는’ 디자인이 아니라, 사용자가 머물고 싶어지는 경험을 설계합니다.",
  },
  {
    titleLines: ["Website", "Publishing"],
    image: img03,
    description:
      "세밀한 구조와 완성도를 중요하게 생각하며, 디자인이 실제 화면 위에서 자연스럽게 구현되는 코드와 인터랙션을 제작합니다. 모든 디바이스에서 일관된 경험을 제공하기 위해 HTML, CSS, JavaScript를 활용한 정교한 구현력에 집중합니다.",
  },
];
