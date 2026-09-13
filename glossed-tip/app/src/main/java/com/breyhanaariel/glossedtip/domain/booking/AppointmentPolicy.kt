package com.breyhanaariel.glossedtip.domain.booking

import com.breyhanaariel.glossedtip.domain.model.TravelZone

object AppointmentPolicy {
    const val FREE_CHANGE_WINDOW_HOURS = 24

    fun depositIsForfeited(hoursUntilAppointment: Long, technicianOverride: Boolean = false): Boolean =
        !technicianOverride && hoursUntilAppointment < FREE_CHANGE_WINDOW_HOURS

    fun waitlistMatch(
        requestedDurationMinutes: Int,
        availableDurationMinutes: Int,
        requestedZone: TravelZone,
        openingZone: TravelZone,
        routeSlackMinutes: Int,
    ): Boolean {
        if (availableDurationMinutes < requestedDurationMinutes) return false
        val zonePenalty = kotlin.math.abs(requestedZone.ordinal - openingZone.ordinal) * 15
        return routeSlackMinutes >= zonePenalty
    }
}
