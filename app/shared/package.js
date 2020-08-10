import {app} from 'electron';
import path from 'path';

export function packageJson() {
    let packagePath;
    if(app.isPackaged){
        packagePath = path.join(__dirname, '..', 'package.json');
    }else{
        packagePath = "./../../package.json";
    }
    return require(packagePath);
}


