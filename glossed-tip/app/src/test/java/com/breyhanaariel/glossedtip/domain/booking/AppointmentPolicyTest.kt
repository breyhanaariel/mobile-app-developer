package com.breyhanaariel.glossedtip.domain.booking

import com.breyhanaariel.glossedtip.domain.model.TravelZone
import org.junit.Assert.*
import org.junit.Test

class AppointmentPolicyTest {
    @Test fun `deposit is kept inside twenty four hour window`() {
        assertTrue(AppointmentPolicy.depositIsForfeited(12))
        assertFalse(AppointmentPolicy.depositIsForfeited(30))
    }

    @Test fun `technician override prevents forfeiture`() {
        assertFalse(AppointmentPolicy.depositIsForfeited(4, technicianOverride = true))
    }

    @Test fun `waitlist requires duration and route slack`() {
        assertTrue(AppointmentPolicy.waitlistMatch(90, 120, TravelZone.CORE, TravelZone.NEARBY, 20))
        assertFalse(AppointmentPolicy.waitlistMatch(150, 120, TravelZone.CORE, TravelZone.CORE, 60))
        assertFalse(AppointmentPolicy.waitlistMatch(90, 120, TravelZone.CORE, TravelZone.EXTENDED, 20))
    }
}
