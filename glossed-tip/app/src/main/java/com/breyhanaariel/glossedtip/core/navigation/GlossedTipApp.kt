package com.breyhanaariel.glossedtip.core.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.breyhanaariel.glossedtip.feature.booking.BookingScreen
import com.breyhanaariel.glossedtip.feature.home.HomeScreen
import com.breyhanaariel.glossedtip.feature.portfolio.PortfolioScreen
import com.breyhanaariel.glossedtip.feature.profile.ProfileScreen

private data class TopLevelDestination(val route: String, val label: String, val icon: ImageVector)

private val destinations = listOf(
    TopLevelDestination("home", "Home", Icons.Outlined.Home),
    TopLevelDestination("portfolio", "Sets", Icons.Outlined.PhotoLibrary),
    TopLevelDestination("book", "Book", Icons.Outlined.CalendarMonth),
    TopLevelDestination("profile", "Profile", Icons.Outlined.Person),
)

@Composable
fun GlossedTipApp() {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar {
                destinations.forEach { destination ->
                    NavigationBarItem(
                        selected = currentRoute == destination.route,
                        onClick = {
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(destination.icon, contentDescription = destination.label) },
                        label = { Text(destination.label) },
                    )
                }
            }
        }
    ) { padding ->
        NavHost(navController = navController, startDestination = "home") {
            composable("home") { HomeScreen(padding, onBook = { navController.navigate("book") }, onPortfolio = { navController.navigate("portfolio") }) }
            composable("portfolio") { PortfolioScreen(padding, onBookSet = { navController.navigate("book") }) }
            composable("book") { BookingScreen(padding) }
            composable("profile") { ProfileScreen(padding) }
        }
    }
}
