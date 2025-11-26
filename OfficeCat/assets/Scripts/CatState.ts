const {ccclass, property} = cc._decorator;

@ccclass
export default class CatState extends cc.Component {

    @property
    public isWorking: boolean = false;
    
    public originalPosition: cc.Vec3 = cc.v3(0, 0, 0);

    // 고양이가 현재 일하고 있는 책상 노드를 저장하기 위한 변수
    public workingDesk: cc.Node = null;
}