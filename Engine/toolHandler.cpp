#include "toolHandler.h"

ToolHandler::ToolHandler(QObject* parent) : QObject(parent) {}

void ToolHandler::setTool(int v) {
    if (m_tool != v) { m_tool = v; emit toolChanged(); }
}
void ToolHandler::setBrushSize(int v) {
    if (m_brushSize != v) { m_brushSize = v; emit brushSizeChanged(); }
}
void ToolHandler::setOpacity(float v) {
    if (m_opacity != v) { m_opacity = v; emit opacityChanged(); }
}
void ToolHandler::setSmoothing(float v) {
    if (m_smoothing != v) { m_smoothing = v; emit smoothingChanged(); }
}
void ToolHandler::setColor(const QString& hex) {
    QColor newColor(hex);
    if (m_color != newColor) {
        m_color = newColor;
        emit colorChanged();
    }
}