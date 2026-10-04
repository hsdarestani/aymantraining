package com.smarbiz.bedifferent.wear

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class Companion(val score:Int,val level:String,val workout:String?)
class MainActivity: ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { WearHome(token = getPreferences(Activity.MODE_PRIVATE).getString("session","") ?: "") }
  }
}
@Composable
fun WearHome(token:String) {
  var data by remember { mutableStateOf<Companion?>(null) }
  var error by remember { mutableStateOf<String?>(null) }
  LaunchedEffect(token) {
    if(token.isBlank()){ error="Bitte zuerst auf dem Telefon anmelden."; return@LaunchedEffect }
    try { data=loadCompanion(token) } catch(_:Throwable){ error="Daten konnten nicht geladen werden." }
  }
  Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp)) {
    Text("BE DIFFERENT", style=MaterialTheme.typography.labelSmall)
    Text("${data?.score ?: 0}%", style=MaterialTheme.typography.displayMedium)
    Text(data?.level ?: "NORMAL", style=MaterialTheme.typography.labelMedium)
    HorizontalDivider(Modifier.padding(vertical=8.dp))
    Text("HEUTE", style=MaterialTheme.typography.labelSmall)
    Text(data?.workout ?: "Heute bewusst regenerieren.", style=MaterialTheme.typography.bodyMedium)
    error?.let { Text(it, color=MaterialTheme.colorScheme.error, style=MaterialTheme.typography.labelSmall) }
  }
}
suspend fun loadCompanion(token:String):Companion = withContext(Dispatchers.IO) {
  val c=URL("https://bedifferent.smarbiz.sbs/api/companion").openConnection() as HttpURLConnection
  c.setRequestProperty("Authorization","Bearer $token"); c.setRequestProperty("x-bd-client","wear")
  val j=JSONObject(c.inputStream.bufferedReader().readText()),score=j.optJSONObject("score"),workout=j.optJSONObject("workout")
  Companion(score?.optInt("total") ?: 0,score?.optString("level") ?: "NORMAL",workout?.optString("title"))
}
