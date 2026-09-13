package com.breyhanaariel.glossedtip

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.breyhanaariel.glossedtip.core.designsystem.GlossedTipTheme
import com.breyhanaariel.glossedtip.core.navigation.GlossedTipApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GlossedTipTheme {
                GlossedTipApp()
            }
        }
    }
}
