package com.breyhanaariel.glossedtip.core.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val IcyPink = Color(0xFFFFE6F1)
private val Lilac = Color(0xFFC9B3FF)
private val DeepPlum = Color(0xFF241727)
private val Cream = Color(0xFFFFFAF7)
private val Mauve = Color(0xFF7A4E6B)
private val SoftGray = Color(0xFFF3EEF2)

private val GlossedTipColors = lightColorScheme(
    primary = DeepPlum,
    onPrimary = Color.White,
    primaryContainer = IcyPink,
    onPrimaryContainer = DeepPlum,
    secondary = Mauve,
    onSecondary = Color.White,
    secondaryContainer = Lilac,
    onSecondaryContainer = DeepPlum,
    background = Cream,
    onBackground = DeepPlum,
    surface = Color.White,
    onSurface = DeepPlum,
    surfaceVariant = SoftGray,
    onSurfaceVariant = Mauve,
)

@Composable
fun GlossedTipTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = GlossedTipColors,
        typography = GlossedTipTypography,
        content = content,
    )
}
