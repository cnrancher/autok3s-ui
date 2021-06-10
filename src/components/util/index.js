export function withInstall(component) {
  component.install = function(app) {
    app.component(component.displayName || component.name, comp);
  }
  return component
}
