


export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface TextWidgetState {
    id: number;
    pos: Position;
    size: Size;
    text: string;
    fontSize: number;
    color: string;
    isUnderlined: boolean;
}

export interface DateWidgetState {
    id: number;
    pos: Position;
    size: Size;
    dateFormat: 'long' | 'short';
}

export interface TimerWidgetState {
    id: number;
    pos: Position;
    size: Size;
}

export interface AdditionWidgetState {
    id: number;
    pos: Position;
    size: Size;
    numOperands: number;
    numCols: number;
    operands?: number[];
}

export interface SoustractionWidgetState {
    id: number;
    pos: Position;
    size: Size;
    numCols: number;
    operands?: number[];
}

export interface ImageWidgetState {
    id: number;
    pos: Position;
    size: Size;
    src: string; // Data URL
}

export interface DrawingWidgetState {
    id: number;
    pos: Position;
    size: Size;
    drawingData: string; // Data URL of the canvas state
}

export interface TableauState {
    activeSkillSlug: string | null;
    textWidgets: TextWidgetState[];
    dateWidgets: DateWidgetState[];
    timerWidgets: TimerWidgetState[];
    additionWidgets: AdditionWidgetState[];
    soustractionWidgets: SoustractionWidgetState[];
    imageWidgets: ImageWidgetState[];
    drawingWidgets: DrawingWidgetState[];
    updatedAt: string | null; // Changed to string for JSON compatibility
}
