/** 由 scripts/extract-ref-data.mjs 从旧站抽取，勿手改大数据 */
export default {
  "kind": "groups",
  "data": [
    {
      "cat": "创建型模式",
      "items": [
        {
          "name": "单例模式 (Singleton)",
          "desc": "确保一个类只有一个实例",
          "syntax": "Singleton.getInstance()",
          "examples": [
            "private static volatile Singleton instance;",
            "双重检查锁定（Double-Checked Locking）"
          ],
          "code": "public class Singleton {\n    private static volatile Singleton instance;\n    private Singleton() {}\n    public static Singleton getInstance() {\n        if (instance == null) {\n            synchronized (Singleton.class) {\n                if (instance == null) {\n                    instance = new Singleton();\n                }\n            }\n        }\n        return instance;\n    }\n}"
        },
        {
          "name": "工厂方法 (Factory Method)",
          "desc": "定义创建对象的接口，让子类决定实例化哪个类",
          "code": "public interface Product {\n    String getName();\n}\n\npublic class ConcreteProductA implements Product {\n    public String getName() { return \"Product A\"; }\n}\n\npublic abstract class Factory {\n    public abstract Product createProduct();\n}\n\npublic class ConcreteFactoryA extends Factory {\n    public Product createProduct() {\n        return new ConcreteProductA();\n    }\n}"
        },
        {
          "name": "抽象工厂 (Abstract Factory)",
          "desc": "创建一系列相关或依赖对象的接口",
          "code": "public interface GUIFactory {\n    Button createButton();\n    TextField createTextField();\n}\n\npublic class WindowsFactory implements GUIFactory {\n    public Button createButton() { return new WindowsButton(); }\n    public TextField createTextField() { return new WindowsTextField(); }\n}\n\npublic class MacFactory implements GUIFactory {\n    public Button createButton() { return new MacButton(); }\n    public TextField createTextField() { return new MacTextField(); }\n}"
        },
        {
          "name": "建造者模式 (Builder)",
          "desc": "将复杂对象的构建与表示分离",
          "code": "public class User {\n    private final String name;\n    private final int age;\n    private final String email;\n\n    private User(Builder builder) {\n        this.name = builder.name;\n        this.age = builder.age;\n        this.email = builder.email;\n    }\n\n    public static class Builder {\n        private String name;\n        private int age;\n        private String email;\n\n        public Builder name(String name) { this.name = name; return this; }\n        public Builder age(int age) { this.age = age; return this; }\n        public Builder email(String email) { this.email = email; return this; }\n        public User build() { return new User(this); }\n    }\n}\n\n// 使用: new User.Builder().name(\"张三\").age(25).email(\"zhangsan@example.com\").build();"
        },
        {
          "name": "原型模式 (Prototype)",
          "desc": "通过复制现有实例来创建新实例",
          "code": "public abstract class Shape implements Cloneable {\n    protected String type;\n    public abstract void draw();\n    public Shape clone() {\n        try {\n            return (Shape) super.clone();\n        } catch (CloneNotSupportedException e) {\n            return null;\n        }\n    }\n}\n\npublic class Circle extends Shape {\n    public Circle() { type = \"Circle\"; }\n    public void draw() { System.out.println(\"Drawing Circle\"); }\n}"
        }
      ]
    },
    {
      "cat": "结构型模式",
      "items": [
        {
          "name": "适配器模式 (Adapter)",
          "desc": "将一个类的接口转换成客户端期望的另一个接口",
          "code": "public interface MediaPlayer {\n    void play(String audioType, String fileName);\n}\n\npublic class AdvancedMediaPlayer {\n    void playVlc(String fileName) { /*...*/ }\n    void playMp4(String fileName) { /*...*/ }\n}\n\npublic class MediaAdapter implements MediaPlayer {\n    private AdvancedMediaPlayer advancedPlayer;\n\n    public MediaAdapter(String audioType) {\n        advancedPlayer = new AdvancedMediaPlayer();\n    }\n\n    public void play(String audioType, String fileName) {\n        if (audioType.equalsIgnoreCase(\"vlc\")) {\n            advancedPlayer.playVlc(fileName);\n        } else if (audioType.equalsIgnoreCase(\"mp4\")) {\n            advancedPlayer.playMp4(fileName);\n        }\n    }\n}"
        },
        {
          "name": "装饰器模式 (Decorator)",
          "desc": "动态地给对象添加额外职责",
          "code": "public interface Shape {\n    void draw();\n}\n\npublic class Circle implements Shape {\n    public void draw() { System.out.println(\"Drawing Circle\"); }\n}\n\npublic abstract class ShapeDecorator implements Shape {\n    protected Shape decoratedShape;\n    public ShapeDecorator(Shape decoratedShape) {\n        this.decoratedShape = decoratedShape;\n    }\n    public void draw() { decoratedShape.draw(); }\n}\n\npublic class RedShapeDecorator extends ShapeDecorator {\n    public RedShapeDecorator(Shape decoratedShape) {\n        super(decoratedShape);\n    }\n    public void draw() {\n        decoratedShape.draw();\n        setRedBorder(decoratedShape);\n    }\n    private void setRedBorder(Shape decoratedShape) {\n        System.out.println(\"Border Color: Red\");\n    }\n}"
        },
        {
          "name": "代理模式 (Proxy)",
          "desc": "为其他对象提供一种代理以控制对这个对象的访问",
          "code": "public interface Image {\n    void display();\n}\n\npublic class RealImage implements Image {\n    private String fileName;\n    public RealImage(String fileName) {\n        this.fileName = fileName;\n        loadFromDisk(fileName);\n    }\n    public void display() { System.out.println(\"Displaying \" + fileName); }\n    private void loadFromDisk(String fileName) {\n        System.out.println(\"Loading \" + fileName);\n    }\n}\n\npublic class ProxyImage implements Image {\n    private RealImage realImage;\n    private String fileName;\n    public ProxyImage(String fileName) { this.fileName = fileName; }\n    public void display() {\n        if (realImage == null) {\n            realImage = new RealImage(fileName);\n        }\n        realImage.display();\n    }\n}"
        },
        {
          "name": "外观模式 (Facade)",
          "desc": "为子系统中的一组接口提供一个一致的界面",
          "code": "public class CPU { void start() { /*...*/ } }\npublic class Memory { void load() { /*...*/ } }\npublic class Disk { void read() { /*...*/ } }\n\npublic class ComputerFacade {\n    private CPU cpu;\n    private Memory memory;\n    private Disk disk;\n\n    public ComputerFacade() {\n        this.cpu = new CPU();\n        this.memory = new Memory();\n        this.disk = new Disk();\n    }\n\n    public void start() {\n        cpu.start();\n        memory.load();\n        disk.read();\n    }\n}"
        },
        {
          "name": "组合模式 (Composite)",
          "desc": "将对象组合成树形结构以表示\"部分-整体\"的层次结构",
          "code": "public abstract class Employee {\n    protected String name;\n    public abstract void show();\n}\n\npublic class Developer extends Employee {\n    public Developer(String name) { this.name = name; }\n    public void show() { System.out.println(\"Developer: \" + name); }\n}\n\npublic class Manager extends Employee {\n    private List<Employee> subordinates = new ArrayList<>();\n    public Manager(String name) { this.name = name; }\n    public void add(Employee e) { subordinates.add(e); }\n    public void show() {\n        System.out.println(\"Manager: \" + name);\n        subordinates.forEach(Employee::show);\n    }\n}"
        }
      ]
    },
    {
      "cat": "行为型模式",
      "items": [
        {
          "name": "策略模式 (Strategy)",
          "desc": "定义一系列算法，把它们一个个封装起来",
          "code": "public interface SortStrategy {\n    void sort(int[] array);\n}\n\npublic class BubbleSort implements SortStrategy {\n    public void sort(int[] array) { /* 冒泡排序实现 */ }\n}\n\npublic class QuickSort implements SortStrategy {\n    public void sort(int[] array) { /* 快速排序实现 */ }\n}\n\npublic class Sorter {\n    private SortStrategy strategy;\n    public void setStrategy(SortStrategy strategy) {\n        this.strategy = strategy;\n    }\n    public void sort(int[] array) {\n        strategy.sort(array);\n    }\n}"
        },
        {
          "name": "观察者模式 (Observer)",
          "desc": "定义对象间的一种一对多的依赖关系",
          "code": "public interface Observer {\n    void update(String message);\n}\n\npublic class Subject {\n    private List<Observer> observers = new ArrayList<>();\n    private String state;\n\n    public void attach(Observer observer) { observers.add(observer); }\n    public void detach(Observer observer) { observers.remove(observer); }\n    public void setState(String state) {\n        this.state = state;\n        notifyAllObservers();\n    }\n    private void notifyAllObservers() {\n        observers.forEach(o -> o.update(state));\n    }\n}\n\npublic class ConcreteObserver implements Observer {\n    private String name;\n    public ConcreteObserver(String name) { this.name = name; }\n    public void update(String message) {\n        System.out.println(name + \" received: \" + message);\n    }\n}"
        },
        {
          "name": "模板方法 (Template Method)",
          "desc": "定义一个操作中的算法骨架，将某些步骤延迟到子类",
          "code": "public abstract class Game {\n    abstract void initialize();\n    abstract void startPlay();\n    abstract void endPlay();\n\n    public final void play() {\n        initialize();\n        startPlay();\n        endPlay();\n    }\n}\n\npublic class Cricket extends Game {\n    void initialize() { System.out.println(\"Cricket Game Initialized\"); }\n    void startPlay() { System.out.println(\"Cricket Game Started\"); }\n    void endPlay() { System.out.println(\"Cricket Game Finished\"); }\n}"
        },
        {
          "name": "状态模式 (State)",
          "desc": "允许对象在内部状态改变时改变它的行为",
          "code": "public interface State {\n    void doAction(Context context);\n}\n\npublic class StartState implements State {\n    public void doAction(Context context) {\n        System.out.println(\"Player is in start state\");\n        context.setState(this);\n    }\n}\n\npublic class StopState implements State {\n    public void doAction(Context context) {\n        System.out.println(\"Player is in stop state\");\n        context.setState(this);\n    }\n}\n\npublic class Context {\n    private State state;\n    public void setState(State state) { this.state = state; }\n    public State getState() { return state; }\n}"
        },
        {
          "name": "责任链模式 (Chain of Responsibility)",
          "desc": "使多个对象都有机会处理请求，将这些对象连成一条链",
          "code": "public abstract class Handler {\n    protected Handler next;\n    public Handler setNext(Handler handler) {\n        this.next = handler;\n        return handler;\n    }\n    public abstract void handle(String request);\n}\n\npublic class AuthHandler extends Handler {\n    public void handle(String request) {\n        if (request.contains(\"auth\")) {\n            System.out.println(\"Authenticated\");\n        } else if (next != null) {\n            next.handle(request);\n        }\n    }\n}\n\npublic class LogHandler extends Handler {\n    public void handle(String request) {\n        System.out.println(\"Logging: \" + request);\n        if (next != null) next.handle(request);\n    }\n}"
        }
      ]
    }
  ]
} as const
