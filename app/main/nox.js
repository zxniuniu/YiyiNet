import path from "path";
import fs from "fs";
import utils from "../utils";

/**
 * 去除NoxPlayer启动时广告（主要是通过删除文件夹，以及设置只读属性来解决）
 */
export async function removeNoxplayerStartAds() {
    let noxFolder = path.join(utils.getUserData(), '..', '..', 'Local', 'Nox', 'loading');
    if(fs.existsSync(noxFolder)) {
        let st = fs.statSync(noxFolder);
        // 如果是文件夹，则删除后新建一个同名文件，并设置为只读
        if (st.isDirectory()) {
            await utils.removeFolder(noxFolder);
            fs.writeFileSync(noxFolder, '', function(err){
                if(err){console.log(err);}
            });
            st = fs.statSync(noxFolder);
        }

        // 将文件设置为只读
        if(st.mode !== 33060){ // 只读 33060
            fs.chmodSync(noxFolder, 33060);
        }
    }
}

export function startNox() {
    

}