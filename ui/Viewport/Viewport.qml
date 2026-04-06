import QtQuick
import QtQuick.Layouts
import Anima.Backend
import Anima.Components 1.0

Rectangle {
    id: root
    color: "#0a0a0c"

    property alias drawArea: drawArea

    Canvas {
        anchors.fill: parent
        onPaint: {
            var ctx = getContext("2d");
            var s = 14;
            for (var r = 0; r * s < height; r++) {
                for (var c = 0; c * s < width; c++) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? "#141416" : "#101012";
                    ctx.fillRect(c * s, r * s, s, s);
                }
            }
        }
    }

    Item {
        id: canvasFrame
        anchors.centerIn: parent
        width: Math.min(parent.width - 40, (parent.height - 40) * (1280 / 720))
        height: width * (720 / 1280)

        Rectangle {
            x: 6
            y: 6
            width: parent.width
            height: parent.height
            color: "#000000"
            opacity: .35
            radius: 3
        }

        Flickable {
            id: canvasContainer
            anchors.fill: parent
            contentWidth: 1280 * canvasScale.xScale
            contentHeight: 720 * canvasScale.yScale
            boundsBehavior: Flickable.StopAtBounds
            clip: true
            interactive: false

            DrawingCanvas {
                id: mainCanvas
                width: 1280
                height: 720
                x: Math.max(0, (canvasContainer.width - width * canvasScale.xScale) / 2)
                y: Math.max(0, (canvasContainer.height - height * canvasScale.yScale) / 2)

                transform: Scale {
                    id: canvasScale
                    origin.x: 640
                    origin.y: 360
                    xScale: 1.0
                    yScale: 1.0
                }

                Connections {
                    target: MainEngine
                    function onFrameUpdated(img) {
                        mainCanvas.updateImage(img);
                    }
                    function onColorPicked(hex) {
                        MainEngine.color = hex;
                    }
                }

                MouseArea {
                    id: drawArea
                    anchors.fill: parent
                    acceptedButtons: Qt.LeftButton | Qt.MiddleButton
                    hoverEnabled: true
                    cursorShape: Qt.BlankCursor

                    property bool drawingActive: false
                    property point lastGlobalPos: Qt.point(0, 0)

                    onPressed: mouse => {
                        if (mouse.button === Qt.MiddleButton) {
                            lastGlobalPos = mapToItem(null, mouse.x, mouse.y);
                        } else if (mouse.button === Qt.LeftButton) {
                            drawingActive = true;
                            MainEngine.beginStroke(mouse.x, mouse.y);
                        }
                    }

                    onPositionChanged: mouse => {
                        if (mouse.buttons & Qt.MiddleButton) {
                            var cur = mapToItem(null, mouse.x, mouse.y);
                            canvasContainer.contentX -= (cur.x - lastGlobalPos.x);
                            canvasContainer.contentY -= (cur.y - lastGlobalPos.y);
                            lastGlobalPos = cur;
                        } else if (drawingActive && (mouse.buttons & Qt.LeftButton)) {
                            MainEngine.paintAt(mouse.x, mouse.y);
                        }
                    }

                    onReleased: mouse => {
                        if (mouse.button === Qt.LeftButton && drawingActive) {
                            drawingActive = false;
                            MainEngine.endStroke();
                        }
                    }

                    onExited: {
                        if (drawingActive) {
                            drawingActive = false;
                            MainEngine.endStroke();
                        }
                    }

                    onWheel: wheel => {
                        var sx = wheel.x;
                        var sy = wheel.y;
                        var cx = (canvasContainer.contentX + sx) / canvasScale.xScale;
                        var cy = (canvasContainer.contentY + sy) / canvasScale.yScale;
                        var f = 1.1;
                        if (wheel.angleDelta.y > 0) {
                            canvasScale.xScale *= f;
                            canvasScale.yScale *= f;
                        } else {
                            canvasScale.xScale /= f;
                            canvasScale.yScale /= f;
                        }
                        canvasContainer.contentX = cx * canvasScale.xScale - sx;
                        canvasContainer.contentY = cy * canvasScale.yScale - sy;
                    }
                }

                Rectangle {
                    id: cursorCircle
                    width: Math.max(4, MainEngine.brushSize * canvasFrame.width / 1280 * 2)
                    height: width
                    radius: width / 2
                    color: "transparent"
                    border.color: "white"
                    border.width: 1
                    opacity: drawArea.containsMouse ? 0.8 : 0
                    visible: MainEngine.tool !== 3

                    Rectangle {
                        anchors.centerIn: parent
                        width: 3
                        height: 3
                        radius: 2
                        color: "white"
                        opacity: .9
                    }
                }
            }
        }
    }

    Rectangle {
        anchors {
            right: parent.right
            bottom: parent.bottom
            margins: 12
        }
        width: zoomLabel.implicitWidth + 16
        height: 22
        radius: 4
        color: "#000000"
        opacity: .55

        Text {
            id: zoomLabel
            anchors.centerIn: parent
            text: Math.round(canvasScale.xScale * 100) + "%"
            color: "#a0a0b0"
            font.pixelSize: 11
        }
    }

    Rectangle {
        anchors {
            left: parent.left
            top: parent.top
            margins: 12
        }
        width: infoTxt.implicitWidth + 18
        height: 22
        radius: 4
        color: "#000000"
        opacity: .55

        Text {
            id: infoTxt
            anchors.centerIn: parent
            text: {
                var t = ["Brush", "Eraser", "Bucket", "Eyedrop"][MainEngine.tool];
                return "Fr " + (TL.currentFrame + 1) + "/" + TL.frameCount + "  " + t + "  " + MainEngine.brushSize + "px";
            }
            color: "#a8a8c0"
            font.pixelSize: 11
        }
    }
}
