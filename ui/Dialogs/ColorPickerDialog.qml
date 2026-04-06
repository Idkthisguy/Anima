import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Anima.Backend

Dialog {
    id: root
    anchors.centerIn: parent
    width: 300
    height: 380
    modal: true

    background: Rectangle {
        color: pal.bg2
        border.color: pal.border
        border.width: 1
        radius: 6
    }
    header: null

    QtObject {
        id: cp
        property bool isUpdating: false
        property real hue: 0.0
        property real sat: 0.0
        property real val: 0.0
        property color current: Qt.hsva(hue, sat, val, 1.0)

        onCurrentChanged: {
            if (!isUpdating) {
                MainEngine.color = current.toString();
            }
        }

        function fromHex(hex) {
            var c = Qt.color(hex);
            isUpdating = true;

            hue = c.hsvHue < 0 ? 0 : c.hsvHue;
            sat = c.hsvSaturation;
            val = c.hsvValue;

            isUpdating = false;
        }
    }

    onOpened: cp.fromHex(MainEngine.color)

    Connections {
        target: MainEngine
        function onColorChanged() {
            cp.fromHex(MainEngine.color);
        }
    }

    ColumnLayout {
        anchors {
            fill: parent
            margins: 16
        }
        spacing: 12

        Text {
            text: "Color"
            color: pal.text
            font.pixelSize: 13
            font.weight: Font.SemiBold
        }

        Item {
            Layout.fillWidth: true
            height: 170

            Rectangle {
                id: svBox
                anchors {
                    left: parent.left
                    top: parent.top
                    bottom: parent.bottom
                }
                width: parent.width - 28
                radius: 5
                clip: true

                Rectangle {
                    anchors.fill: parent
                    radius: 5
                    gradient: Gradient {
                        orientation: Gradient.Horizontal
                        GradientStop {
                            position: 0.0
                            color: "white"
                        }
                        GradientStop {
                            position: 1.0
                            color: Qt.hsva(cp.hue, 1, 1, 1)
                        }
                    }
                }
                Rectangle {
                    anchors.fill: parent
                    radius: 5
                    gradient: Gradient {
                        orientation: Gradient.Vertical
                        GradientStop {
                            position: 0.0
                            color: "transparent"
                        }
                        GradientStop {
                            position: 1.0
                            color: "black"
                        }
                    }
                }

                Rectangle {
                    x: cp.sat * parent.width - 5
                    y: (1 - cp.val) * parent.height - 5
                    width: 10
                    height: 10
                    radius: 5
                    color: "transparent"
                    border.color: "white"
                    border.width: 2
                    Rectangle {
                        anchors {
                            fill: parent
                            margins: 2
                        }
                        radius: 3
                        color: Qt.hsva(cp.hue, cp.sat, cp.val, 1)
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    onPressed: m => {
                        cp.sat = Math.max(0, Math.min(1, m.x / width));
                        cp.val = Math.max(0, Math.min(1, 1 - m.y / height));
                    }
                    onPositionChanged: m => {
                        if (pressed) {
                            cp.sat = Math.max(0, Math.min(1, m.x / width));
                            cp.val = Math.max(0, Math.min(1, 1 - m.y / height));
                        }
                    }
                }
            }

            Rectangle {
                anchors {
                    right: parent.right
                    top: parent.top
                    bottom: parent.bottom
                }
                width: 20
                radius: 4
                clip: true

                gradient: Gradient {
                    orientation: Gradient.Vertical
                    GradientStop {
                        position: 0.00
                        color: "#ff0000"
                    }
                    GradientStop {
                        position: 0.17
                        color: "#ffff00"
                    }
                    GradientStop {
                        position: 0.33
                        color: "#00ff00"
                    }
                    GradientStop {
                        position: 0.50
                        color: "#00ffff"
                    }
                    GradientStop {
                        position: 0.67
                        color: "#0000ff"
                    }
                    GradientStop {
                        position: 0.83
                        color: "#ff00ff"
                    }
                    GradientStop {
                        position: 1.00
                        color: "#ff0000"
                    }
                }

                Rectangle {
                    y: (cp.hue !== undefined ? cp.hue : 0) * parent.height - 5
                    x: -3
                    width: parent.width + 6
                    height: 10
                    radius: 3
                    color: "transparent"
                    border.color: "white"
                    border.width: 2
                }

                MouseArea {
                    anchors.fill: parent
                    onPressed: m => cp.hue = Math.max(0, Math.min(1, m.y / height))
                    onPositionChanged: m => {
                        if (pressed)
                            cp.hue = Math.max(0, Math.min(1, m.y / height));
                    }
                }
            }
        }

        Row {
            spacing: 8
            Rectangle {
                width: 28
                height: 28
                radius: 4
                color: cp.current
                border.color: pal.border
            }
            Text {
                text: "#"
                color: pal.dim
                font.pixelSize: 13
                anchors.verticalCenter: parent.verticalCenter
            }
            Rectangle {
                width: 100
                height: 28
                radius: 4
                color: pal.bg4
                border.color: pal.border
                TextInput {
                    id: hexIn
                    anchors {
                        fill: parent
                        margins: 6
                    }
                    text: cp.current.toString().replace("#", "").toUpperCase().slice(0, 6)
                    color: pal.text
                    font.pixelSize: 12
                    font.family: "Courier New"
                    maximumLength: 6
                    onEditingFinished: {
                        MainEngine.setColor("#" + text);
                        cp.fromHex("#" + text);
                    }
                }
            }
        }

        Row {
            spacing: 3
            Repeater {
                model: ["#000", "#555", "#aaa", "#fff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"]
                delegate: Rectangle {
                    required property string modelData
                    width: 16
                    height: 16
                    radius: 3
                    color: modelData
                    TapHandler {
                        onTapped: {
                            MainEngine.setColor(modelData);
                            cp.fromHex(modelData);
                        }
                    }
                }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            Item {
                Layout.fillWidth: true
            }
            Rectangle {
                width: 58
                height: 26
                radius: 4
                color: pal.acc
                Text {
                    anchors.centerIn: parent
                    text: "Done"
                    color: "white"
                    font.pixelSize: 12
                }
                TapHandler {
                    onTapped: root.close()
                }
            }
        }
    }
}
