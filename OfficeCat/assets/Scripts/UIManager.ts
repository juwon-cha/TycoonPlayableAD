import GameManager from "./GameManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    @property({type: cc.SpriteFrame, displayName: "Button Sprite"})
    btnSpriteFrame: cc.SpriteFrame = null;
    
    @property({type: cc.Node, displayName: "UI Root (optional)"})
    uiRootNode: cc.Node = null;

    // UI Elements
    private _goldLabel: cc.Label = null;
    private _buttonLabels: cc.Label[] = [];
    
    // Internal State
    private _gameManager: GameManager = null;
    private uiInitialized: boolean = false;

    // Hold-to-work State
    private _isWorkButtonPressed: boolean = false;
    private _workButtonHoldTime: number = 0;
    private _timeSinceLastWorkCall: number = 0;
    private _currentWorkCallInterval: number = 0.5;

    // Hold-to-work Constants
    private readonly MIN_WORK_CALL_INTERVAL: number = 0.05;  // 가장 빠른 호출 간격 (초)
    private readonly INITIAL_WORK_CALL_INTERVAL: number = 0.5; // 초기 호출 간격 (초)
    private readonly ACCELERATION_FACTOR: number = 0.2;      // 호출 간격이 얼마나 빨리 짧아지는지에 대한 계수

    public createUI(gameManager: GameManager) {
        if (this.uiInitialized) return;
        this.uiInitialized = true;
        this._gameManager = gameManager; // GameManager 참조 저장

        const uiRoot = gameManager.uiLayer;
        const screenSize = cc.winSize;
        
        // 골드 UI
        let goldLabelBgNode = new cc.Node("GoldLabelBg");
        let labelBg = goldLabelBgNode.addComponent(cc.Sprite);
        labelBg.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        if (this.btnSpriteFrame) labelBg.spriteFrame = this.btnSpriteFrame;
        goldLabelBgNode.color = cc.color(0, 0, 0, 150);
        goldLabelBgNode.width = 300; goldLabelBgNode.height = 70;
        goldLabelBgNode.setPosition(0, screenSize.height / 2 - 100);
        uiRoot.addChild(goldLabelBgNode);

        let goldLabelTextNode = new cc.Node("GoldLabelText");
        this._goldLabel = goldLabelTextNode.addComponent(cc.Label);
        this._goldLabel.fontSize = 40;
        goldLabelTextNode.color = cc.Color.WHITE;
        goldLabelBgNode.addChild(goldLabelTextNode);

        // 버튼 UI
        let buttonContainer = new cc.Node("ButtonContainer");
        const buttonWidth = 160; const buttonSpacing = 30; 
        buttonContainer.width = (buttonWidth * 3) + (buttonSpacing * 2);
        buttonContainer.height = 150;
        buttonContainer.setPosition(0, -screenSize.height / 2 + 170);
        uiRoot.addChild(buttonContainer);

        const buttonLabels = ["일시키기", "업그레이드", "확장하기"];
        const buttonHandlers = ["onClickWork", "onClickUpgrade", "onClickExpand"];

        for (let i = 0; i < buttonLabels.length; i++) {
            let buttonNode = new cc.Node(buttonLabels[i] + "Button");
            let sprite = buttonNode.addComponent(cc.Sprite);
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            if (this.btnSpriteFrame) sprite.spriteFrame = this.btnSpriteFrame;
            
            buttonNode.width = buttonWidth; buttonNode.height = 100;
            buttonNode.color = cc.Color.BLUE;

            let labelNode = new cc.Node("Label");
            let label = labelNode.addComponent(cc.Label);
            label.string = buttonLabels[i];
            label.fontSize = 20;
            labelNode.color = cc.Color.WHITE;
            buttonNode.addChild(labelNode);
            this._buttonLabels.push(label);

            // '일 시키기' 버튼만 터치 이벤트를 직접 처리
            if (buttonHandlers[i] === "onClickWork") {
                buttonNode.on(cc.Node.EventType.TOUCH_START, this.onWorkButtonTouchStart, this);
                buttonNode.on(cc.Node.EventType.TOUCH_END, this.onWorkButtonTouchEnd, this);
                buttonNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onWorkButtonTouchEnd, this);
            } else {
                // 다른 버튼들은 기존 cc.Button 컴포넌트 방식 사용
                let button = buttonNode.addComponent(cc.Button);
                button.transition = cc.Button.Transition.SCALE; button.zoomScale = 0.95;
                let eventHandler = new cc.Component.EventHandler();
                eventHandler.target = gameManager.node;
                eventHandler.component = "GameManager";
                eventHandler.handler = buttonHandlers[i];
                button.clickEvents.push(eventHandler);
            }
            
            let posX = (i - (buttonLabels.length - 1) / 2) * (buttonWidth + buttonSpacing);
            buttonNode.setPosition(posX, 0);
            buttonContainer.addChild(buttonNode);
        }

        this.updateGoldLabel(gameManager.gold);
        this.updateButtonLabels(gameManager);
    }
    
    onWorkButtonTouchStart(event: cc.Event.EventTouch) {
        this._isWorkButtonPressed = true;
        this._workButtonHoldTime = 0;
        // 즉시 한 번 호출되도록 _timeSinceLastWorkCall을 초기 간격값으로 설정
        this._timeSinceLastWorkCall = this.INITIAL_WORK_CALL_INTERVAL; 
        this._currentWorkCallInterval = this.INITIAL_WORK_CALL_INTERVAL;

        // 이벤트가 다른 노드로 전파되는 것을 막음
        event.stopPropagation();
    }

    onWorkButtonTouchEnd(event: cc.Event.EventTouch) {
        this._isWorkButtonPressed = false;
        this._workButtonHoldTime = 0;
    }

    update(dt: number) {
        if (!this._isWorkButtonPressed) return;

        this._workButtonHoldTime += dt;
        this._timeSinceLastWorkCall += dt;

        // 버튼을 누르고 있는 시간에 비례하여 호출 간격을 점차 줄임
        this._currentWorkCallInterval = Math.max(
            this.MIN_WORK_CALL_INTERVAL, 
            this.INITIAL_WORK_CALL_INTERVAL - this._workButtonHoldTime * this.ACCELERATION_FACTOR
        );

        // 설정된 호출 간격 시간이 지났는지 확인
        if (this._timeSinceLastWorkCall >= this._currentWorkCallInterval) {
            if (this._gameManager) {
                this._gameManager.onClickWork();
            }
            this._timeSinceLastWorkCall = 0; // 다음 호출을 위해 타이머 초기화
        }
    }

    public updateGoldLabel(gold: number) {
        if (this._goldLabel) this._goldLabel.string = "Gold: " + gold.toString();
    }
    
    public updateButtonLabels(gameManager: GameManager) {
        if (this._buttonLabels.length !== 3) return;
        this._buttonLabels[0].string = `일시키기 (${gameManager.workCost}G)`;
        
        const currentLevel = gameManager.offices.length > 0 ? gameManager.offices[0].level : 0;
        const isMaxLevel = currentLevel >= gameManager.MAX_LEVEL;
        
        if (isMaxLevel) {
            this._buttonLabels[1].string = "최대 레벨";
        } else {
            this._buttonLabels[1].string = `책상확장 (${gameManager.upgradeCost}G)`;
        }
        
        const isMaxExpand = gameManager.currentOfficeCount >= gameManager.maxOfficeCount;
        this._buttonLabels[2].string = isMaxExpand ? "최대 확장" : `확장하기 (${gameManager.expandCost}G)`;
    }

    public showToastMessage(message: string) {
        if (!this.uiRootNode) {
            console.warn("uiRootNode is not set in UIManager. Toast message cannot be shown.");
            return;
        }

        let toastNode = new cc.Node("ToastMessage");
        let sprite = toastNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        if (this.btnSpriteFrame) sprite.spriteFrame = this.btnSpriteFrame;
        
        toastNode.color = cc.Color.BLACK;
        toastNode.opacity = 200;
        toastNode.width = 400;
        toastNode.height = 80;

        let textNode = new cc.Node("Text");
        let label = textNode.addComponent(cc.Label);
        label.string = message;
        label.fontSize = 35;
        label.lineHeight = 40;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        textNode.color = cc.Color.WHITE;

        toastNode.addChild(textNode);
        toastNode.setPosition(0, 0);
        toastNode.zIndex = 999;
        this.uiRootNode.addChild(toastNode);

        toastNode.scale = 0;
        cc.tween(toastNode)
            .to(0.2, { scale: 1.0 }, { easing: 'backOut' })
            .delay(0.8)
            .to(0.5, { opacity: 0, position: cc.v3(0, 100, 0) })
            .call(() => {
                toastNode.destroy();
            })
            .start();
    }
}
