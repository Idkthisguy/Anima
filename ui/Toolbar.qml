import QtQuick
import QtQuick.Layouts
import QtQuick.Effects
import QtQuick.Controls
import Anima.Backend

Rectangle {
    id: root
    width: 48
    color: pal.bg1

    required property var colorDialog

    Rectangle {
        anchors.right: parent.right
        width: 1
        height: parent.height
        color: pal.border
    }

    Column {
        anchors {
            top: parent.top
            horizontalCenter: parent.horizontalCenter
            topMargin: 12
        }
        spacing: 4

        Repeater {
            model: [
                {
                    lbl: "Br",
                    tip: "Brush (B)",
                    id: 0,
                    icon: "../assets/icons/brush.svg"
                },
                {
                    lbl: "Er",
                    tip: "Eraser (E)",
                    id: 1,
                    icon: "../assets/icons/eraser.svg"
                },
                {
                    lbl: "Bk",
                    tip: "Bucket (G)",
                    id: 2,
                    icon: "../assets/icons/bucket.svg"
                },
                {
                    lbl: "Ey",
                    tip: "Eyedrop (I)",
                    id: 3,
                    icon: "../assets/icons/colorpicker.svg"
                }
            ]

            delegate: Item {
                width: 40
                height: 36
                required property var modelData

                Rectangle {
                    anchors {
                        left: parent.left
                        verticalCenter: parent.verticalCenter
                    }
                    width: 3
                    height: 28
                    radius: 2
                    color: pal.acc
                    visible: MainEngine.tool === modelData.id
                }

                Rectangle {
                    anchors.centerIn: parent
                    width: 34
                    height: 32
                    radius: 5
                    color: MainEngine.tool === modelData.id ? pal.accDim : toolHov.containsMouse ? pal.bg4 : "transparent"

                    Image {
                        id: toolIcon
                        anchors.centerIn: parent
                        source: modelData.icon
                        width: 20
                        height: 20
                        sourceSize.width: 20
                        sourceSize.height: 20
                        visible: false
                    }

                    MultiEffect {
                        anchors.fill: toolIcon
                        source: toolIcon
                        colorizationColor: MainEngine.tool === modelData.id ? pal.acc : pal.dim
                        colorization: 1.0
                    }

                    HoverHandler {
                        id: toolHov
                    }
                    TapHandler {
                        onTapped: MainEngine.tool = modelData.id
                    }
                    ToolTip.visible: toolHov.hovered
                    ToolTip.text: modelData.tip
                    ToolTip.delay: 600
                }
            }
        }

        Rectangle {
            width: 32
            height: 1
            color: pal.border
            anchors.horizontalCenter: parent.horizontalCenter
        }

        Repeater {
            model: [
                {
                    lbl: "Un",
                    tip: "Undo  Ctrl+Z",
                    icon: "../assets/icons/undo.svg"
                },
                {
                    lbl: "Re",
                    tip: "Redo  Ctrl+Y",
                    icon: "../assets/icons/redo.svg"
                }
            ]

            delegate: Rectangle {
                width: 34
                height: 28
                radius: 4
                anchors.horizontalCenter: parent.horizontalCenter
                color: urHov.containsMouse ? pal.bg4 : "transparent"
                required property var modelData

                Image {
                    id: utilIcon
                    anchors.centerIn: parent
                    source: modelData.icon
                    width: 20
                    height: 20
                    sourceSize.width: 20
                    sourceSize.height: 20
                    visible: false
                }

                MultiEffect {
                    anchors.fill: utilIcon
                    source: utilIcon
                    colorizationColor: pal.dim
                    colorization: 1.0
                }

                HoverHandler {
                    id: urHov
                }
                TapHandler {
                    onTapped: modelData.lbl === "Un" ? TL.undo() : TL.redo()
                }
                ToolTip.visible: urHov.hovered
                ToolTip.text: modelData.tip
                ToolTip.delay: 600
            }
        }
        Rectangle {
            width: 32
            height: 1
            color: pal.border
            anchors.horizontalCenter: parent.horizontalCenter
        }

        Rectangle {
            width: 34
            height: 34
            radius: 6
            anchors.horizontalCenter: parent.horizontalCenter
            color: MainEngine.color
            border.color: Qt.lighter(pal.border, 1.4)
            border.width: 1.5

            HoverHandler {
                id: swatchHov
            }
            TapHandler {
                onTapped: root.colorDialog.open()
            }
            ToolTip.visible: swatchHov.hovered
            ToolTip.text: "Color"
            ToolTip.delay: 600
        }
    }
}
