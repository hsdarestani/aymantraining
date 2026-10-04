const {withAndroidManifest,withDangerousMod,withMainApplication}=require("@expo/config-plugins");
const fs=require("fs");
const path=require("path");

function ensureReceiver(manifest){
 const app=manifest.manifest.application?.[0];
 if(!app)return manifest;
 app.receiver=app.receiver||[];
 const name="com.smarbiz.bedifferent.widget.BeDifferentWidgetProvider";
 if(!app.receiver.some(x=>x.$?.["android:name"]===name)){
  app.receiver.push({
   $:{"android:name":name,"android:exported":"true"},
   "intent-filter":[{action:[{$:{"android:name":"android.appwidget.action.APPWIDGET_UPDATE"}}]}],
   "meta-data":[{$:{"android:name":"android.appwidget.provider","android:resource":"@xml/be_different_widget_info"}}]
  });
 }
 return manifest;
}
function write(file,content){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)}

module.exports=function withAndroidWidget(config){
 config=withAndroidManifest(config,c=>{c.modResults=ensureReceiver(c.modResults);return c});
 config=withMainApplication(config,c=>{
  let s=c.modResults.contents;
  if(!s.includes("import com.smarbiz.bedifferent.widget.WidgetSyncPackage"))s=s.replace(/(package [^\n]+\n)/,"$1\nimport com.smarbiz.bedifferent.widget.WidgetSyncPackage\n");
  if(!s.includes("add(WidgetSyncPackage())"))s=s.replace("PackageList(this).packages.apply {","PackageList(this).packages.apply {\n              add(WidgetSyncPackage())");
  c.modResults.contents=s;return c;
 });
 config=withDangerousMod(config,["android",async c=>{
  const root=c.modRequest.platformProjectRoot;
  const java=path.join(root,"app/src/main/java/com/smarbiz/bedifferent/widget");
  write(path.join(java,"BeDifferentWidgetProvider.kt"),`package com.smarbiz.bedifferent.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.smarbiz.bedifferent.R

class BeDifferentWidgetProvider: AppWidgetProvider() {
 override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
  val prefs=context.getSharedPreferences("be_different_widget",Context.MODE_PRIVATE)
  val score=prefs.getInt("score",0)
  val level=prefs.getString("level","NORMAL") ?: "NORMAL"
  val workout=prefs.getString("workout","REGENERATION") ?: "REGENERATION"
  ids.forEach { id ->
   val view=RemoteViews(context.packageName,R.layout.be_different_widget)
   view.setTextViewText(R.id.widgetScore,"\${score}%")
   view.setTextViewText(R.id.widgetLevel,level)
   view.setTextViewText(R.id.widgetWorkout,workout)
   manager.updateAppWidget(id,view)
  }
 }
}`);
  write(path.join(java,"WidgetSyncModule.kt"),`package com.smarbiz.bedifferent.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetSyncModule(private val context: ReactApplicationContext): ReactContextBaseJavaModule(context) {
 override fun getName()="WidgetSync"
 @ReactMethod fun set(score:Double,level:String,workout:String){
  context.getSharedPreferences("be_different_widget",0).edit().putInt("score",score.toInt()).putString("level",level).putString("workout",workout).apply()
  val manager=AppWidgetManager.getInstance(context)
  val component=ComponentName(context,BeDifferentWidgetProvider::class.java)
  val intent=android.content.Intent(context,BeDifferentWidgetProvider::class.java).apply{action=AppWidgetManager.ACTION_APPWIDGET_UPDATE;putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS,manager.getAppWidgetIds(component))}
  context.sendBroadcast(intent)
 }
}`);
  write(path.join(java,"WidgetSyncPackage.kt"),`package com.smarbiz.bedifferent.widget

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class WidgetSyncPackage: ReactPackage {
 override fun createNativeModules(reactContext:ReactApplicationContext):List<NativeModule> = listOf(WidgetSyncModule(reactContext))
 override fun createViewManagers(reactContext:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}`);
  write(path.join(root,"app/src/main/res/layout/be_different_widget.xml"),`<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp" android:background="#050606">
 <TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="BE DIFFERENT" android:textStyle="bold" android:textColor="#D4FF00" android:textSize="10sp"/>
 <TextView android:id="@+id/widgetScore" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="0%" android:textStyle="bold" android:textColor="#FFFFFF" android:textSize="38sp"/>
 <TextView android:id="@+id/widgetLevel" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="NORMAL" android:textStyle="bold" android:textColor="#D4FF00" android:textSize="10sp"/>
 <Space android:layout_width="1dp" android:layout_height="0dp" android:layout_weight="1"/>
 <TextView android:id="@+id/widgetWorkout" android:layout_width="match_parent" android:layout_height="wrap_content" android:maxLines="2" android:text="REGENERATION" android:textStyle="bold" android:textColor="#FFFFFF" android:textSize="11sp"/>
</LinearLayout>`);
  write(path.join(root,"app/src/main/res/xml/be_different_widget_info.xml"),`<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="180dp" android:minHeight="110dp" android:updatePeriodMillis="1800000" android:initialLayout="@layout/be_different_widget" android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen"/>
`);
  return c;
 }]);
 return config;
};
