---
name: entitlements
description: iOS app entitlements, capabilities configuration, and required usage description strings.
---

# Entitlements & Capabilities

> **Scope:** Management and configuration of iOS app entitlements, capabilities, and required usage description strings

## Rules

- **MUST** — Every app target has a `.entitlements` file (XML plist format) committed to version control.
- **MUST** — All entitlements declared in code are registered in the Signing & Capabilities tab.
- **MUST** — Provisioning profiles are regenerated whenever capabilities change; never reuse stale profiles.
- **MUST** — App Groups and Keychain Sharing entitlements are identical across the main app and all extension targets that share data.
- **MUST** — Usage description strings in `Info.plist` match every capability that requires user permission.
- **SHOULD** — Document why restricted capabilities (HealthKit, HomeKit, NFC) are required in code comments.

## Common Capabilities Reference

| Capability | Entitlement Key | Info.plist Key | Notes |
|-----------|----------------|-----------------|-------|
| Push Notifications | `aps-environment` | None | `development` or `production` |
| iCloud / CloudKit | `com.apple.developer.icloud-container-identifiers` | None | Requires CloudKit container in Developer Portal |
| Keychain Sharing | `keychain-access-groups` | None | Share credentials across app group |
| App Groups | `com.apple.security.application-groups` | None | Share data between app and extensions |
| HealthKit | `com.apple.developer.healthkit` | `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription` | Restricted capability |
| HomeKit | `com.apple.developer.homekit` | `NSHomeKitUsageDescription` | Restricted capability |
| NFC | `com.apple.developer.nfc.readersession.formats` | `NFCReaderUsageDescription` | Restricted capability |
| Camera | None | `NSCameraUsageDescription` | Runtime permission required |
| Location (When In Use) | None | `NSLocationWhenInUseUsageDescription` | Runtime permission required |
| Microphone | None | `NSMicrophoneUsageDescription` | Runtime permission required |

## Entitlements File

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>production</string>
    <key>com.apple.developer.icloud-container-identifiers</key>
    <array>
        <string>iCloud.com.yourcompany.yourapp</string>
    </array>
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.yourcompany.yourapp</string>
    </array>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.yourcompany.yourapp</string>
    </array>
</dict>
</plist>
```

## Debugging Entitlements

1. Check entitlements in your built app:
   ```bash
   codesign -d --entitlements - YourApp.app
   ```

2. Check entitlements in your provisioning profile:
   ```bash
   security cms -D -i embedded.mobileprovision | grep -A 20 "Entitlements"
   ```

3. Common causes of mismatches:
   - Entitlements file not added to the correct target
   - App ID in Developer Portal missing the capability
   - Stale provisioning profile (regenerate after capability changes)
   - Different entitlements between Debug and Release schemes
   - Extension target missing shared entitlements
