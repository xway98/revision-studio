const fs = require('fs');
const path = require('path');

function mergeToStandalone(htmlFile, cssFile, jsFile, outFile) {
    let html = fs.readFileSync(htmlFile, 'utf8');

    if (cssFile && fs.existsSync(cssFile)) {
        const cssContent = fs.readFileSync(cssFile, 'utf8');
        const cssTag = '<style>\n' + cssContent + '\n</style>';
        html = html.replace(/<link[^>]*href=["']([^"']*\.css)["'][^>]*>/i, cssTag);
    }

    if (jsFile && fs.existsSync(jsFile)) {
        const jsContent = fs.readFileSync(jsFile, 'utf8');
        const jsTag = '<script>\n' + jsContent + '\n</script>';
        html = html.replace(/<script[^>]*src=["']([^"']*\.js)["'][^>]*>[\s\S]*?<\/script>/i, jsTag);
        // Remove the remaining relative tags if any exist further down.
        html = html.replace(/<script[^>]*src=["']\/?virtual-chemlab\/[^"']*\.js["'][^>]*>[\s\S]*?<\/script>/i, '');
    }

    fs.writeFileSync(outFile, html, 'utf8');
    console.log('Merged', outFile);
}

const dir = 'c:/Users/ggs/Desktop/Atoms/revision-studio/virtual-chemlab';

// 1. active-inquiry
mergeToStandalone(
    path.join(dir, 'active-inquiry.html'),
    path.join(dir, 'active-inquiry.css'),
    path.join(dir, 'active-inquiry.js'),
    path.join(dir, 'active-inquiry.html')
);

// 2. electricity
mergeToStandalone(
    path.join(dir, 'electricity.html'),
    path.join(dir, 'electricity.css'),
    path.join(dir, 'electricity.js'),
    path.join(dir, 'electricity.html')
);

// 3. hcl-preparation
mergeToStandalone(
    path.join(dir, 'hcl-preparation.html'),
    path.join(dir, 'gamified-lab.css'),
    path.join(dir, 'hcl-preparation.js'),
    path.join(dir, 'hcl-preparation.html')
);

// 4. index / reaction of zinc (uses style.css and app.js)
mergeToStandalone(
    path.join(dir, 'index.html'),
    path.join(dir, 'style.css'),
    path.join(dir, 'app.js'),
    path.join(dir, 'index.html')
);
