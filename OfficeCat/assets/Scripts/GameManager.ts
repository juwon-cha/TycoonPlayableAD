import CatState from "./CatState";
import DeskState from "./DeskState";
import UIManager from "./UIManager";

const {ccclass, property} = cc._decorator;

interface OfficeData {
    node: cc.Node;
    deskNodes: cc.Node[];
    isUnlocked: boolean;
    level: number; // 0: 1개, 1: 3개, 2: 6개, 3: 9개(MAX)
}

@ccclass
export default class GameManager extends cc.Component {

    // --- Editor Properties ---
    @property({type: cc.Integer, displayName: "Initial Gold"})
    gold: number = 20;

    @property({type: cc.Integer, displayName: "Work Cost"})
    workCost: number = 1;

    @property({type: cc.Integer, displayName: "Work Reward"})
    workReward: number = 10;
    
    @property({type: cc.Integer, displayName: "Upgrade Cost"})
    upgradeCost: number = 60;

    @property({type: cc.Integer, displayName: "Expand Cost"})
    expandCost: number = 100;

    @property({type: cc.Prefab, displayName: "Cat Prefab"})
    catPrefab: cc.Prefab = null;
    
    @property({type: cc.Prefab, displayName: "Timer Prefab"})
    timerPrefab: cc.Prefab = null;

    @property({type: cc.SpriteFrame, displayName: "Background Sprite"})
    backgroundSpriteFrame: cc.SpriteFrame = null;
    
    @property(UIManager)
    public uiManager: UIManager = null;

    // Internal & Public Variables
    public gameLayer: cc.Node = null;
    public uiLayer: cc.Node = null;

    public offices: OfficeData[] = [];
    public readonly MAX_LEVEL: number = 3;
    public maxOfficeCount: number = 4;
    public currentOfficeCount: number = 1;

    private _workingCats: cc.Node[] = [];
    
    private catPool: cc.NodePool;
    private timerPool: cc.NodePool;
    private _catLine: cc.Node[] = [];
    private catLineSize: number = 10;
    
    private catLineStartX: number = 0; 
    private catLineStartY: number = -50; 
    private catLineSpacing: number = 50;

    private officeSize: cc.Size = cc.size(350, 350);
    private deskSize: cc.Size = cc.size(60, 40);
    private deskColor: cc.Color = cc.color(150, 75, 0);
    private officeGap: number = 70;

    onLoad () {
        if (!this.catPrefab || !this.timerPrefab) {
            console.error("Prefab 연결 확인 필요");
            this.enabled = false; return;
        }
        if (!this.uiManager) {
            console.error("UIManager가 Cocos Creator 에디터에서 연결되지 않았습니다.");
            this.enabled = false; return;
        }

        this.catPool = new cc.NodePool('Cat');
        this.timerPool = new cc.NodePool('Timer');
        
        this.initLayers();
        this.createOffices();
        this.uiManager.createUI(this);

        this.catLineStartX = 0; 
        this.catLineStartY = 0;
    }

    start () {
        this.initializeCatLine();
        if (this.offices.length > 0) {
            this.focusOnOffice(0);
        }
    }

    // Layer & Camera Logic
    initLayers() {
        this.gameLayer = new cc.Node("GameLayer");
        this.node.addChild(this.gameLayer);

        this.uiLayer = new cc.Node("UILayer");
        this.node.addChild(this.uiLayer);
        this.uiLayer.zIndex = 100;
        
        const widget = this.uiLayer.addComponent(cc.Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
    }

    focusOnOffice(index: number) {
        const targetPos = this.offices[index].node.position;
        cc.tween(this.gameLayer)
            .to(1.0, { position: cc.v3(-targetPos.x, -targetPos.y, 0), scale: 1.0 }, { easing: 'cubicOut' })
            .start();
    }

    zoomOutToViewAll() {
        cc.tween(this.gameLayer)
            .to(1.0, { position: cc.v3(0, 0, 0), scale: 0.55 }, { easing: 'cubicOut' })
            .start();
    }

    // Object Pooling & Cat Line
    getNewCat(): cc.Node {
        let cat: cc.Node = null;
        if (this.catPool.size() > 0) cat = this.catPool.get();
        else cat = cc.instantiate(this.catPrefab);
        cat.getComponent(CatState).isWorking = false;
        return cat;
    }

    putCat(cat: cc.Node) {
        this.catPool.put(cat);
    }

    getNewTimer(): cc.Node {
        let timer: cc.Node = null;
        if (this.timerPool.size() > 0) {
            timer = this.timerPool.get();
        } else {
            timer = cc.instantiate(this.timerPrefab);
        }
        return timer;
    }

    putTimer(timer: cc.Node) {
        this.timerPool.put(timer);
    }

    initializeCatLine() {
        for (let i = 0; i < this.catLineSize; i++) this.addCatToLine(false);
    }
    
    addCatToLine(animated: boolean) {
        const newCat = this.getNewCat();
        const index = this._catLine.length;
        const newPos = cc.v3(this.catLineStartX, this.catLineStartY - index * this.catLineSpacing, 0);
        
        if (animated) {
            newCat.setPosition(this.catLineStartX, this.catLineStartY - (index + 1) * this.catLineSpacing);
            cc.tween(newCat).to(0.3, { position: newPos }).start();
        } else {
            newCat.setPosition(newPos);
        }
        
        this.gameLayer.addChild(newCat);
        this._catLine.push(newCat);
    }

    updateCatLine() {
        for (let i = 0; i < this._catLine.length; i++) {
            const cat = this._catLine[i];
            const newPos = cc.v3(this.catLineStartX, this.catLineStartY - i * this.catLineSpacing, 0);
            cc.tween(cat).to(0.3, { position: newPos }).start();
        }
        this.addCatToLine(true);
    }
    
    // Office Creation
    createOffices() {
        const halfW = this.officeSize.width / 2 + this.officeGap;
        const halfH = this.officeSize.height / 2 + this.officeGap;

        const positions = [
            cc.v2(-halfW, -halfH), 
            cc.v2(halfW, -halfH),  
            cc.v2(-halfW, halfH),  
            cc.v2(halfW, halfH)    
        ];

        for (let i = 0; i < 4; i++) {
            let officeNode = new cc.Node(`Office_${i}`);
            this.gameLayer.addChild(officeNode);
            officeNode.setPosition(positions[i]);

            if (this.backgroundSpriteFrame) {
                let bgNode = new cc.Node("Bg");
                let sprite = bgNode.addComponent(cc.Sprite);
                sprite.spriteFrame = this.backgroundSpriteFrame;
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                bgNode.setContentSize(this.officeSize);
                bgNode.color = (i === 0) ? cc.Color.WHITE : cc.Color.GRAY;
                officeNode.addChild(bgNode, -1, "Bg"); 
            }

            const officeData: OfficeData = {
                node: officeNode,
                deskNodes: [],
                isUnlocked: (i === 0),
                level: 0
            };

            this.createDeskGrid(officeData);
            officeNode.opacity = (i === 0) ? 255 : 100;
            this.offices.push(officeData);
        }
    }

    createDeskGrid(officeData: OfficeData) {
        officeData.deskNodes.forEach(n => n.destroy());
        officeData.deskNodes = [];

        const officeNode = officeData.node;
        const gapX = 80;
        const gapY = 60;

        let positions: cc.Vec2[] = [];

        if (officeData.level >= 0) positions.push(cc.v2(0, 0));
        if (officeData.level >= 1) {
            positions.push(cc.v2(-gapX, 0));
            positions.push(cc.v2(gapX, 0));
        }
        if (officeData.level >= 2) {
            positions.push(cc.v2(0, gapY));
            positions.push(cc.v2(-gapX, gapY));
            positions.push(cc.v2(gapX, gapY));
        }
        if (officeData.level >= 3) {
            positions.push(cc.v2(0, -gapY));
            positions.push(cc.v2(-gapX, -gapY));
            positions.push(cc.v2(gapX, -gapY));
        }

        for (let pos of positions) {
            this.addDesk(officeNode, pos, officeData);
        }
    }

    addDesk(parent: cc.Node, pos: cc.Vec2, officeData: OfficeData) {
        let deskNode = new cc.Node("Desk");
        let graphics = deskNode.addComponent(cc.Graphics);
        graphics.fillColor = this.deskColor;
        graphics.rect(-this.deskSize.width/2, -this.deskSize.height/2, this.deskSize.width, this.deskSize.height);
        graphics.fill();
        deskNode.setPosition(pos);
        deskNode.addComponent(DeskState);
        parent.addChild(deskNode);
        officeData.deskNodes.push(deskNode);
    }

    // Button Actions
    onClickWork() {
        if (this.gold < this.workCost) return;
        if (this._catLine.length === 0) return;

        let targetDesk: cc.Node = null;
        for (let office of this.offices) {
            if (!office.isUnlocked) continue;
            for (let desk of office.deskNodes) {
                if (!desk.getComponent(DeskState).isOccupied) {
                    targetDesk = desk;
                    break;
                }
            }
            if (targetDesk) break;
        }

        if (!targetDesk) { 
            console.log("빈 책상이 없습니다."); 
            this.uiManager.showToastMessage("자리 없음");
            return; 
        }

        this.gold -= this.workCost;
        this.uiManager.updateGoldLabel(this.gold);
        const catToGo = this._catLine.shift();
        this.updateCatLine();
        this.startCatWork(catToGo, targetDesk);
    }

    startCatWork(cat: cc.Node, desk: cc.Node) {
        let catState = cat.getComponent(CatState);
        let deskState = desk.getComponent(DeskState);
        
        catState.isWorking = true;
        deskState.isOccupied = true;
        this._workingCats.push(cat);

        // 좌표 계산
        let deskWorldPos = desk.parent.convertToWorldSpaceAR(desk.position);
        let targetPosition = this.gameLayer.convertToNodeSpaceAR(deskWorldPos);
        const exitPos = cc.v3(this.catLineStartX, -cc.winSize.height/2 - 500, 0);

        const workDuration = 2.0;
        
        // 타이머 노드 생성 (오브젝트 풀 사용) 및 월드 좌표 설정
        const timerNode = this.getNewTimer();
        
        this.gameLayer.addChild(timerNode);
        
        const timerOffset = cc.v2(0, 50);
        const timerWorldPos = desk.convertToWorldSpaceAR(timerOffset);
        const timerNodeSpacePos = this.gameLayer.convertToNodeSpaceAR(timerWorldPos);
        timerNode.setPosition(timerNodeSpacePos);
        
        timerNode.active = false;

        const foreground = timerNode.getChildByName('Foreground').getComponent(cc.Sprite);
        foreground.fillRange = 0;

        cc.tween(cat)
            .to(0.5, { position: targetPosition }, { easing: 'cubicOut' })
            .call(() => {
                timerNode.active = true; 
                cc.tween(foreground)
                    .to(workDuration, { fillRange: -1 })
                    .start();
            })
            .delay(workDuration)
            .call(() => {
                this.gold += this.workReward;
                this.uiManager.updateGoldLabel(this.gold);
                
                this.putTimer(timerNode);
            })
            .to(0.5, { position: exitPos }, { easing: 'cubicIn' })
            .call(() => {
                deskState.isOccupied = false;
                const idx = this._workingCats.indexOf(cat);
                if (idx > -1) this._workingCats.splice(idx, 1);
                this.putCat(cat);
            })
            .start();
    }

    onClickUpgrade() {
        if (this.gold < this.upgradeCost) return;
        
        if (this.offices[0].level >= this.MAX_LEVEL) {
            console.log("최대 레벨입니다."); 
            return; 
        }

        this.gold -= this.upgradeCost;
        this.upgradeCost *= 2;
        
        this.offices.forEach(office => {
            if (office.isUnlocked) {
                if (office.level < this.MAX_LEVEL) {
                    office.level++;
                    this.createDeskGrid(office);
                }
            }
        });

        this.uiManager.updateGoldLabel(this.gold);
        this.uiManager.updateButtonLabels(this);
    }

    onClickExpand() {
        if (this.currentOfficeCount >= this.maxOfficeCount) return;
        if (this.gold < this.expandCost) return;

        this.gold -= this.expandCost;
        this.expandCost *= 2;

        const nextOfficeIndex = this.currentOfficeCount;
        const nextOffice = this.offices[nextOfficeIndex];
        
        nextOffice.isUnlocked = true;
        nextOffice.node.opacity = 255;
        nextOffice.node.getChildByName("Bg").color = cc.Color.WHITE;
        
        const currentLevel = this.offices[0].level;
        nextOffice.level = currentLevel;
        this.createDeskGrid(nextOffice);

        this.currentOfficeCount++;
        
        if (this.currentOfficeCount === 2) {
            this.zoomOutToViewAll();
        }

        this.uiManager.updateGoldLabel(this.gold);
        this.uiManager.updateButtonLabels(this);
    }
}
