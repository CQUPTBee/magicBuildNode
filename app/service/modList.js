'use strict'
const Service = require('egg').Service;
// const request = require('request');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const clone = require('git-clone');
const Mod = require('../db/modSchema.js');
const Page = require('../db/pageSchema.js');
const cdn = require('cdn');

class modListService extends Service {
  async render(req) {
    // 删除clone过的模板
    console.log('fs.exists(app / public / repo / mods)', fs.existsSync('app/public/repo/mods'))
    if (fs.existsSync('app/public/repo/mods')){
      fse.removeSync('app/public/repo/mods')
      console.log('mods 文件已移除')
    }

    let promise = new Promise((resolve, reject) => {
      // 获取模板coding地址
      let repoUrl = req.repository.ssh_url;
      console.log('repoUrl:  ', repoUrl);
      // clone目标文件夹
      // let targetPath =  '../public/repo/mods'    
      let targetPath = path.resolve(__dirname, '../','public/repo/mods');
      console.log('targetPath: ', targetPath);
      // clone代码
      clone(repoUrl, targetPath, function (err) {
        if (err) {
          console.log('clone err', err);
          reject(0);
        }
        // 新clone的模板数组
        let repoPath = path.resolve(__dirname, '../', 'public/repo/mods/src/components/modsList/');
        console.log('repoPath: ', repoPath);
        let repoFolder = fs.readdirSync(repoPath);
        console.log('新clone的模板数组repoFolder: ', repoFolder);
        // 遍历package.json,判断模板是否存在
        repoFolder.forEach((val, index) => {
          let fPath = repoPath + '/' + val;
          console.log('fpth: ', fPath);
          let stats = fs.statSync(fPath);
          // 判断是否是文件夹
          if (stats.isDirectory()) {
            // 读取json文件
            let pkgFile = fs.readFileSync(fPath + '/package.json', 'utf-8');
            console.log('pkgFile:', typeof pkgFile);
            console.log('pkgFile.name: ', JSON.parse(pkgFile).name);
            let pkgData = JSON.parse(pkgFile);
            // 读取默认数据  cdn
            let tplAddress = fPath + '/src/build';
            // cdn
            let localAddress = fs.readFileSync(fPath + '/src/build/local.json', 'utf-8');
            let modData = fs.readFileSync(fPath + '/src/build/data.json', 'utf-8');

            // 查询数据库中模块总数
            let count = Mod.aggregate({ 
              $group: { 
                _id: null, 
                maxBalance: { 
                  $max: '$tplId' 
                }
              }
            },function (err, res) {
                if (err) 
                return 0;
                console.log(res); 
              });
            // console.log('count : ', count);
            // 在集合中查询模块名
            Mod.find({
              tplName: pkgData.name
            }, (err, res) => {
              if (err) {
                console.log('tplName err:', err);
                return;
              }
              // 查询结果为空
              if (res == '') {
                // 发送数据和local.json到cdn
                // 新建数据模型
                let newMod = Mod({
                  tplId: count + 1,
                  proId: 1,
                  tplName: pkgData.name,
                  tplVersion: pkgData.version,
                  tplAddress: tplAddress,
                  localAddress: localAddress,
                  data: modData
                });
                // console.log('newMod: ', newMod);
                Mod.create(newMod, (err, res) => {
                  if (err) {
                    console.log('tplName creat err：', err);
                    return;
                  }
                  console.log('tplName creat success！ ')
                  resolve();
                });
              } else {
                Mod.find({
                  tplVersion: pkgData.version
                }, (err, res) => {
                  if (err) {
                    console.log('tplVersion err ', err);
                    return;
                  }
                  console.log('tplVersion res');
                  if (res == '') {
                    // 发送数据和local.json到cdn
                    let newMod = new Mod({
                      tplName: pkgData.name,
                      tplVersion: pkgData.version,
                      tplAddress: tplAddress,
                      data: modData
                    });
                    // console.log('newMod: ', newMod);
                    Mod.create(newMod, (err, res) => {
                      if (err) {
                        console.log('tplVersion creat err: ', err);
                        return 0;
                      }
                      console.log('tplVersion creat success！ ')
                      resolve('ok');    
                      return 1;                  
                    });
                  } else {
                    console.log('tplVersion 已经存在');
                    // return;
                  }
                  resolve('ok2');                  
                })
              }
            })
          }else{
            console.log('不是文件夹')
            return 0;
          }
        })
      })
    })
    return promise;
  }
}
module.exports = modListService;