#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQuickStyle>
#include "Engine/enginemanager.h"
#include "canvasprovider.h"

int main(int argc, char* argv[]) {
    QQuickStyle::setStyle("Material");
    qputenv("QT_QUICK_CONTROLS_MATERIAL_THEME", "Dark");

    QGuiApplication app(argc, argv);
    app.setApplicationName("Anima");
    app.setApplicationVersion("2.0");
    app.setOrganizationName("AnimaStudio");
    QQuickStyle::setStyle("Basic");

    EngineManager animaEngine;

    QQmlApplicationEngine qmlEngine;
    qmlRegisterSingletonInstance("Anima.Backend",    1, 0, "MainEngine", &animaEngine);
    qmlRegisterSingletonInstance("Anima.Backend",    1, 0, "TL",         animaEngine.timeline());
    qmlRegisterSingletonInstance("Anima.Backend",    1, 0, "IO",         animaEngine.fileio());
    qmlRegisterType<CanvasProvider>("Anima.Components", 1, 0, "DrawingCanvas");
    qmlRegisterUncreatableType<ToolHandler>("Anima", 1, 0, "ToolHandler", "Access via Engine");

    QObject::connect(&qmlEngine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, []{ QCoreApplication::exit(-1); }, Qt::QueuedConnection);

    qmlEngine.loadFromModule("Anima_Pro", "Main");
    return QCoreApplication::exec();
}