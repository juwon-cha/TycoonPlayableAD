# Office Cat Tycoon - A Mini Tycoon Game for Playable Ad

[![Cocos Creator](https://img.shields.io/badge/Cocos%20Creator-v2.4.15-blue)](https://www.cocos.com/en/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Game Genre](https://img.shields.io/badge/Genre-Casual%20%7C%20Tycoon-green)]()

> **트리플라(TREEPLLA)의 "캐주얼 게임 플레이어블 광고 개발자" 포지션에 지원하기 위해 제작한 포트폴리오 프로젝트입니다.**
>
> 블로그 글 "[이 게임, 어디부터 어디까지 AI로 만들었을까?](https://blog.treeplla.com/%EC%9D%B4-%EA%B2%8C%EC%9E%84-%EC%96%B4%EB%94%94%EB%B6%80%ED%84%B0-%EC%96%B4%EB%94%94%EA%B9%8C%EC%A7%80-ai%EB%A1%9C-%EB%A7%8C%EB%93%A4%EC%97%88%EC%9D%84%EA%B9%8C-bd1fbc973200)"를 감명 깊게 읽었습니다. 특히 비개발 직군이 AI를 활용해 플레이어블 광고를 만들고, 더 나아가 Cocos Creator를 학습하여 최적화된 결과물을 만들어내는 과정은 기술에 대한 열정과 주도적인 문제 해결 능력을 중요시하는 기업 문화를 보여주었습니다.
>
> 트리플라의 성장 중심 문화에 동기를 부여받아  **Cocos Creator와 TypeScript 역량**을 활용하여 플레이어블 광고의 핵심을 담은 프로젝트를 개발했습니다.

<br>

## 🎮 게임 플레이 미리보기

<div align="center"><img src="https://github.com/user-attachments/assets/e37386ef-80e6-47d0-a0e3-4f61f863e976" width="200" height="350"></div>

<br>

## ✨ 프로젝트 핵심 강점

### 1. **플레이어블 광고에 최적화된 기술 스택**
- **Cocos Creator v2.4.15** 와 **TypeScript**를 사용하여 개발하였습니다.
- 게임의 핵심 로직부터 UI까지 모두 코드를 통해 제어하며 플레이어블 광고 빌드 시 발생할 수 있는 다양한 요구사항에 유연하게 대응할 수 있습니다.

### 2. **지속적인 흥미를 유발하는 타이쿤 게임 루프**
- "고양이 고용 → 사무실 책상 배치 → 골드 획득 → 책상/사무실 확장"으로 이어지는 **중독성 있는 성장형 게임 루프**를 구현했습니다.
- 이는 짧은 광고 시간 동안 유저의 몰입을 유도하고 "더 해보고 싶다"는 감정을 자극하여 높은 전환율을 기대할 수 있는 핵심적인 구조입니다.

### 3. **성능 최적화를 위한 Object Pooling 적용**
- `GameManager` 내에 `cc.NodePool`을 활용하여 게임의 핵심 오브젝트인 고양이와 타이머를 관리합니다.
- 반복적으로 생성되고 사라지는 오브젝트를 재활용함으로써, **가비지 컬렉션(GC) 부담을 줄이고 프레임 드랍을 방지**합니다. 이는 저사양 디바이스에서도 부드러운 플레이 경험을 제공해야 하는 플레이어블 광고의 필수 요건입니다.

### 4. **확장과 유지보수를 고려한 클린 아키텍처**
- **`GameManager`**: 게임의 핵심 상태(재화, 레벨 등)와 로직을 총괄하는 중앙 관리자 역할을 합니다.
- **`UIManager`**: 게임 로직과 UI를 완벽히 분리하여, UI 요소의 추가/변경이 게임 로직에 영향을 주지 않도록 설계했습니다.
- **`CatState`, `DeskState`**: 각 게임 오브젝트가 자신의 상태를 갖도록 했습니다. 개별 오브젝트의 동작을 직관적으로 관리하고 디버깅을 용이하게 합니다.

### 5. **사용자 경험을 고려한 디테일**
- "일 시키기" 버튼을 **길게 누르고 있으면(Hold-to-action)** 작업 실행 속도가 점차 가속됩니다. 이는 반복적인 터치로 인한 유저의 피로감을 줄이고 시원한 조작감을 통해 만족도를 높이는 장치입니다.
- "자리 없음", "최대 레벨" 등 현재 상황을 알려주는 **토스트 메시지** 시스템을 구현하여 유저에게 직관적인 피드백을 제공합니다.

<br>

## ⚙️ 주요 기능 및 코드 설명

### GameManager.ts
- 게임의 모든 데이터를 관리하고 핵심 로직을 실행합니다.
- `createOffices()`, `createDeskGrid()`: 레벨에 따라 사무실과 책상 배치를 동적으로 생성합니다.
- `onClickWork()`, `onClickUpgrade()`, `onClickExpand()`: 사용자의 주요 액션(일하기, 업그레이드, 확장)을 처리합니다.
- `focusOnOffice()`, `zoomOutToViewAll()`: 사무실 확장 시 부드러운 카메라 워크를 통해 향상된 시각적 경험을 제공합니다.

### UIManager.ts
- `createUI()`: 골드, 버튼 등 모든 UI 요소를 코드를 통해 동적으로 생성하고 배치합니다.
- `update(dt)` & `onWorkButtonTouch...()`: "일 시키기" 버튼의 홀드 입력을 감지하고, 시간이 지남에 따라 `onClickWork()` 호출 간격을 점차 줄여나가는 로직을 처리합니다.
- `updateButtonLabels()`: 게임 재화 및 레벨에 따라 버튼의 텍스트(`업그레이드 (100G)` 등)를 동적으로 갱신합니다.

<br>

## 🚀 실행 방법

1. 다음 주소에서 게임을 플레이할 수 있습니다: [https://juwon-cha.github.io/TycoonPlayableAD/](https://juwon-cha.github.io/TycoonPlayableAD/)
2. Cocos Creator v2.4.15 버전을 설치합니다.
3.  이 프로젝트를 Cocos Creator로 엽니다.
4.  에디터 상단의 ▶ (플레이) 버튼을 눌러 시뮬레이터에서 실행하거나, [프로젝트] -> [빌드] 메뉴를 통해 웹(web-mobile) 버전으로 빌드할 수 있습니다.
