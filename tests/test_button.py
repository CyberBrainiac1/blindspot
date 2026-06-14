import unittest

from device.blindspot_device.button import ButtonGesture, ConsoleButton
from device.blindspot_device.led_strip import NullLedStrip


class ConsoleButtonTests(unittest.TestCase):
    def test_console_mapping(self) -> None:
        # The real console path is interactive; this test protects the public enum values
        # that are used in saved photo prefixes and downstream scripts.
        self.assertEqual(ButtonGesture.SINGLE.value, "single")
        self.assertEqual(ButtonGesture.DOUBLE.value, "double")
        self.assertEqual(ButtonGesture.LONG.value, "long")
        self.assertIsInstance(ConsoleButton(), ConsoleButton)

    def test_null_led_strip_is_safe_noop(self) -> None:
        leds = NullLedStrip()

        leds.ready()
        leds.show_state(ride_active=True, video_recording=True)
        leds.capturing()
        leds.saved()
        leds.error()
        leds.off()


if __name__ == "__main__":
    unittest.main()
