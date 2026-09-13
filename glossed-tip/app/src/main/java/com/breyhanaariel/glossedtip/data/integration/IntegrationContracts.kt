package com.breyhanaariel.glossedtip.data.integration

import com.breyhanaariel.glossedtip.domain.model.*

/**
 * Contracts deliberately compile without Firebase/Stripe/Google SDKs.
 * Concrete implementations are added after project credentials are created.
 */
interface AuthGateway {
    val isAuthenticated: Boolean
    suspend fun signInWithGoogle(): Result<Unit>
    suspend fun requestPhoneOtp(phoneNumber: String): Result<Unit>
    suspend fun verifyPhoneOtp(code: String): Result<Unit>
    suspend fun signOut()
}

interface AddressGateway {
    suspend fun autocomplete(query: String): Result<List<AddressSuggestion>>
    suspend fun resolve(placeId: String): Result<ServiceAddress>
    suspend fun savedAddresses(): Result<List<ServiceAddress>>
    suspend fun saveAddress(address: ServiceAddress): Result<ServiceAddress>
}

data class AddressSuggestion(val placeId: String, val primaryText: String, val secondaryText: String)

data class RouteEstimate(val travelMinutes: Int, val distanceMeters: Int)

interface RoutingGateway {
    suspend fun estimateRoute(origin: GeoPoint, destination: GeoPoint): Result<RouteEstimate>
}

interface InspirationStorageGateway {
    suspend fun upload(localUri: String, customerId: String): Result<String>
}

interface BookingRepository {
    suspend fun createTenMinuteHold(draft: BookingDraft): Result<AppointmentHold>
    suspend fun releaseHold(holdId: String): Result<Unit>
    suspend fun confirmBooking(holdId: String, paymentIntentId: String): Result<String>
}

data class PaymentSheetConfig(val paymentIntentClientSecret: String, val customerId: String? = null, val ephemeralKey: String? = null)

interface PaymentGateway {
    suspend fun createDepositPayment(holdId: String, amountCents: Int): Result<PaymentSheetConfig>
}

object IntegrationReadiness {
    const val FIREBASE_PROJECT_ID = "glossed-tip"
    const val ANDROID_APPLICATION_ID = "com.breyhanaariel.glossedtip"
    const val APPOINTMENT_HOLD_MINUTES = 10

    // Remain false until credentials/config files exist. The local demo booking engine stays usable.
    const val FIREBASE_ENABLED = false
    const val GOOGLE_MAPS_ENABLED = false
    const val STRIPE_ENABLED = false
}
