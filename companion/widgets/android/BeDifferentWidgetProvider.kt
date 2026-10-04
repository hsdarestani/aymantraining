package com.smarbiz.bedifferent.widget

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
      view.setTextViewText(R.id.widgetScore,"$score%")
      view.setTextViewText(R.id.widgetLevel,level)
      view.setTextViewText(R.id.widgetWorkout,workout)
      manager.updateAppWidget(id,view)
    }
  }
}
