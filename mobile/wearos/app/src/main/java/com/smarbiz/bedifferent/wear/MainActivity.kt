package com.smarbiz.bedifferent.wear

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.widget.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity: Activity() {
 private val base="https://bedifferent.smarbiz.sbs"
 private lateinit var root:LinearLayout
 private var token:String?=null
 private var workoutId:String?=null
 private var exerciseId:String?=null
 private var nextSet=1
 private var reps=8
 private var weight=0.0
 private var rpe=7

 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);token=getPreferences(MODE_PRIVATE).getString("session",null);render()}
 private fun text(value:String,size:Float=14f,color:Int=Color.WHITE,bold:Boolean=false)=TextView(this).apply{this.text=value;textSize=size;setTextColor(color);gravity=Gravity.CENTER;if(bold)setTypeface(typeface,Typeface.BOLD);setPadding(8,6,8,6)}
 private fun button(label:String,action:()->Unit)=Button(this).apply{text=label;setOnClickListener{action()}}
 private fun baseRoot()=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER_HORIZONTAL;setPadding(16,16,16,16);setBackgroundColor(Color.rgb(5,6,6))}
 private fun render(){root=baseRoot();val scroll=ScrollView(this);scroll.addView(root);setContentView(scroll);root.addView(text("BE DIFFERENT",11f,Color.rgb(212,255,0),true));if(token.isNullOrBlank())renderPair() else renderDashboard()}
 private fun renderPair(){
  root.addView(text("WATCH KOPPELN",18f,Color.WHITE,true))
  val code=EditText(this).apply{hint="123456";inputType=2;gravity=Gravity.CENTER;setTextColor(Color.WHITE);setHintTextColor(Color.GRAY);textSize=22f}
  root.addView(code);root.addView(button("KOPPELN"){pair(code.text.toString())});root.addView(text("Den Code erzeugst du in der BE DIFFERENT App unter Apple Watch und Widget.",10f,Color.LTGRAY))
 }
 private fun pair(code:String){
  if(code.length!=6){toast("Sechsstelligen Code eingeben.");return}
  network({
   val c=open("/api/companion/pair/claim","POST",null,JSONObject().put("code",code).toString());val body=c.inputStream.bufferedReader().readText();if(c.responseCode !in 200..299)throw Exception(body);JSONObject(body).getString("sessionToken")
  }){t->token=t;getPreferences(MODE_PRIVATE).edit().putString("session",t).apply();render()}
 }
 private fun renderDashboard(){
  root.addView(text("DEIN LEISTUNGSWERT",10f,Color.LTGRAY,true));val loading=text("LÄDT…",16f,Color.WHITE,true);root.addView(loading)
  root.addView(button("AKTUALISIEREN"){render()});root.addView(button("TRENNEN"){getPreferences(MODE_PRIVATE).edit().clear().apply();token=null;render()})
  network({
   val c=open("/api/companion","GET",token,null);val body=c.inputStream.bufferedReader().readText();if(c.responseCode !in 200..299)throw Exception(body);JSONObject(body)
  }){j->
   root.removeView(loading)
   val score=j.optJSONObject("score");root.addView(text((score?.optInt("total",0) ?: 0).toString()+"%",38f,Color.WHITE,true));root.addView(text(score?.optString("level","NORMAL") ?: "NORMAL",10f,Color.rgb(212,255,0),true))
   val w=j.optJSONObject("workout");if(w==null){root.addView(text("HEUTE REGENERATION",14f,Color.WHITE,true));return@network}
   workoutId=w.getString("id");root.addView(text(w.optString("title","TRAINING"),15f,Color.WHITE,true))
   val arr=w.optJSONArray("exercises");var current:JSONObject?=null
   if(arr!=null)for(i in 0 until arr.length()){val e=arr.getJSONObject(i);if(e.optInt("completed")<e.optInt("sets")){current=e;break}}
   if(current==null){root.addView(text("ALLE SÄTZE ERLEDIGT",11f,Color.rgb(212,255,0),true));root.addView(stepper("RPE",rpe,1,10){rpe=it});root.addView(button("TRAINING ABSCHLIESSEN"){completeWorkout()});return@network}
   exerciseId=current!!.getString("id");nextSet=current!!.optInt("completed")+1;reps=parseReps(current!!.optString("reps","8"))
   root.addView(text(current!!.optString("name"),15f,Color.WHITE,true));root.addView(text("SATZ "+nextSet+" VON "+current!!.optInt("sets"),10f,Color.LTGRAY,true))
   root.addView(stepper("WDH",reps,0,100){reps=it});root.addView(doubleStepper("KG",weight,0.0,300.0,2.5){weight=it});root.addView(stepper("RPE",rpe,1,10){rpe=it});root.addView(button("SATZ SPEICHERN"){saveSet()})
  }
 }
 private fun parseReps(s:String)=Regex("\\d+").find(s)?.value?.toIntOrNull()?:8
 private fun stepper(label:String,start:Int,min:Int,max:Int,onChange:(Int)->Unit):LinearLayout{
  var value=start;val row=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER};val valueText=text(label+" "+value,13f,Color.WHITE,true)
  row.addView(button("−"){if(value>min){value--;valueText.text=label+" "+value;onChange(value)}});row.addView(valueText);row.addView(button("+"){if(value<max){value++;valueText.text=label+" "+value;onChange(value)}});return row
 }
 private fun doubleStepper(label:String,start:Double,min:Double,max:Double,step:Double,onChange:(Double)->Unit):LinearLayout{
  var value=start;val row=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER};val valueText=text(label+" "+String.format("%.1f",value),13f,Color.WHITE,true)
  row.addView(button("−"){if(value-step>=min){value-=step;valueText.text=label+" "+String.format("%.1f",value);onChange(value)}});row.addView(valueText);row.addView(button("+"){if(value+step<=max){value+=step;valueText.text=label+" "+String.format("%.1f",value);onChange(value)}});return row
 }
 private fun saveSet(){
  val w=workoutId?:return;val e=exerciseId?:return
  network({val body=JSONObject().put("action","set").put("workoutId",w).put("exerciseId",e).put("setNumber",nextSet).put("reps",reps).put("weightKg",weight).put("rpe",rpe).toString();val c=open("/api/companion","POST",token,body);if(c.responseCode !in 200..299)throw Exception("save");true}){toast("Satz gespeichert.");render()}
 }
 private fun completeWorkout(){
  val w=workoutId?:return
  network({val body=JSONObject().put("action","complete").put("workoutId",w).put("rpe",rpe).toString();val c=open("/api/companion","POST",token,body);if(c.responseCode !in 200..299)throw Exception("finish");true}){toast("Training abgeschlossen.");render()}
 }
 private fun open(path:String,method:String,session:String?,body:String?):HttpURLConnection{
  val c=URL(base+path).openConnection() as HttpURLConnection;c.requestMethod=method;c.connectTimeout=12000;c.readTimeout=12000;c.setRequestProperty("x-bd-client","wear");if(session!=null)c.setRequestProperty("Authorization","Bearer "+session);if(body!=null){c.doOutput=true;c.setRequestProperty("content-type","application/json");c.outputStream.use{it.write(body.toByteArray())}};return c
 }
 private fun <T> network(block:()->T,done:(T)->Unit){Thread{try{val x=block();runOnUiThread{done(x)}}catch(e:Throwable){runOnUiThread{toast("Verbindung fehlgeschlagen.")}}}.start()}
 private fun toast(m:String)=Toast.makeText(this,m,Toast.LENGTH_SHORT).show()
}
