//
//  ProfileView.swift
//  Blind Spot
//
//  The Profile tab: the rider details collected at onboarding (name, email,
//  phone, skill, weekly frequency) plus the emergency contact, all editable and
//  written back to the shared `AppEnvironment.profile` (persisted locally).
//
//  A disabled "Sign out" placeholder notes that auth arrives with the data layer.
//

import SwiftUI

struct ProfileView: View {

    @Environment(AppEnvironment.self) private var environment

    var body: some View {
        // Bindable so we can two-way bind directly to the persisted profile.
        @Bindable var env = environment

        return NavigationStack {
            ZStack {
                Color.bsBlack.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        identityCard(env: env)
                        ridingCard(env: env)
                        emergencyCard(env: env)
                        accountCard
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Profile")
            .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    // MARK: Identity (name / email / phone)

    private func identityCard(env: AppEnvironment) -> some View {
        BSCard {
            VStack(alignment: .leading, spacing: 18) {
                labeledField(
                    "DISPLAY NAME", placeholder: "Your name",
                    text: bindingFor(env, \.displayName),
                    font: .bsHeadline, keyboard: .default, autocap: .words)

                Divider().overlay(Color.bsWhite.opacity(0.1))

                labeledField(
                    "EMAIL", placeholder: "you@example.com",
                    text: bindingFor(env, \.email),
                    font: .bsBody, keyboard: .emailAddress, autocap: .never)

                Divider().overlay(Color.bsWhite.opacity(0.1))

                labeledField(
                    "PHONE", placeholder: "(555) 123-4567",
                    text: bindingFor(env, \.phone),
                    font: .bsBody, keyboard: .phonePad, autocap: .never)
            }
        }
    }

    // MARK: Riding (skill / frequency)

    private func ridingCard(env: AppEnvironment) -> some View {
        BSCard {
            VStack(alignment: .leading, spacing: 18) {
                // Skill level — a menu of the enum cases.
                pickerRow(label: "SKILL LEVEL",
                          current: env.profile.skillLevel?.displayName ?? "Not set") {
                    ForEach(BikingSkill.allCases) { option in
                        Button(option.displayName) { env.profile.skillLevel = option }
                    }
                }

                Divider().overlay(Color.bsWhite.opacity(0.1))

                // Weekly frequency.
                pickerRow(label: "RIDES PER WEEK",
                          current: env.profile.weeklyFrequency?.displayName ?? "Not set") {
                    ForEach(RideFrequency.allCases) { option in
                        Button(option.displayName) { env.profile.weeklyFrequency = option }
                    }
                }
            }
        }
    }

    // MARK: Emergency contact

    private func emergencyCard(env: AppEnvironment) -> some View {
        BSCard {
            VStack(alignment: .leading, spacing: 12) {
                labeledField(
                    "EMERGENCY CONTACT", placeholder: "Name & phone",
                    text: bindingFor(env, \.emergencyContact),
                    font: .bsBody, keyboard: .phonePad, autocap: .words)

                Text("Used by the crash-SOS flow to know who to alert.")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.bsWhite.opacity(0.4))
            }
        }
    }

    // MARK: Account / auth placeholder

    private var accountCard: some View {
        BSCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("ACCOUNT")
                    .font(.bsCaption)
                    .tracking(1.2)
                    .foregroundStyle(Color.bsWhite.opacity(0.6))

                Button { /* no-op */ } label: {
                    Text("Sign out")
                        .font(.bsBody)
                        .foregroundStyle(Color.bsWhite.opacity(0.4))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .disabled(true)

                Text("Sign-in & accounts arrive with the data layer.")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.bsWhite.opacity(0.4))

                Divider().overlay(Color.bsWhite.opacity(0.1))

                // Debug affordance: re-run the onboarding flow.
                Button {
                    environment.hasCompletedOnboarding = false
                } label: {
                    Label("Replay onboarding", systemImage: "arrow.counterclockwise")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.bsPrimary)
                }
            }
        }
    }

    // MARK: - Reusable bits

    /// A labeled text field that reads/writes a String? field on the profile.
    private func labeledField(
        _ label: String,
        placeholder: String,
        text: Binding<String>,
        font: Font,
        keyboard: UIKeyboardType,
        autocap: TextInputAutocapitalization
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.bsCaption)
                .tracking(1.2)
                .foregroundStyle(Color.bsWhite.opacity(0.6))
            TextField("", text: text, prompt: Text(placeholder)
                .foregroundColor(Color.bsWhite.opacity(0.3)))
                .font(font)
                .foregroundStyle(Color.bsWhite)
                .keyboardType(keyboard)
                .textInputAutocapitalization(autocap)
                .autocorrectionDisabled(keyboard == .emailAddress)
        }
    }

    /// A label + a menu that shows the current value and lets the user change it.
    private func pickerRow<Content: View>(
        label: String,
        current: String,
        @ViewBuilder menu: () -> Content
    ) -> some View {
        HStack {
            Text(label)
                .font(.bsCaption)
                .tracking(1.2)
                .foregroundStyle(Color.bsWhite.opacity(0.6))
            Spacer()
            Menu {
                menu()
            } label: {
                HStack(spacing: 6) {
                    Text(current)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.bsPrimary)
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.bsPrimary)
                }
            }
        }
    }

    /// Bridge a `String?` profile field to a non-optional `Binding<String>` for
    /// TextField, writing nil back when emptied.
    private func bindingFor(
        _ env: AppEnvironment,
        _ keyPath: WritableKeyPath<Profile, String?>
    ) -> Binding<String> {
        Binding(
            get: { env.profile[keyPath: keyPath] ?? "" },
            set: { newValue in
                let trimmed = newValue.trimmingCharacters(in: .whitespaces)
                env.profile[keyPath: keyPath] = trimmed.isEmpty ? nil : newValue
            }
        )
    }
}

#Preview {
    ProfileView()
        .environment(AppEnvironment(
            hazardRepository: MockHazardRepository(),
            rideRepository: MockRideRepository()
        ))
        .preferredColorScheme(.dark)
}
