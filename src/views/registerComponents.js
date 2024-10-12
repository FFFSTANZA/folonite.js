import path from 'path';
import fs from 'fs';

// Object to store registered components
export const components = {};

// Register components dynamically from the components directory
export async function registerComponents() {
  const componentsDir = path.resolve('./src/components');
  const files = fs.readdirSync(componentsDir);

  for (const file of files) {
    if (file.endsWith('.js')) {
      const componentName = file.replace('.js', '');
      const componentModule = await import(path.join(componentsDir, file));
      components[componentName] = componentModule.default;
    }
  }
}
