//
//  OnboardingViewModel.swift
//  Blind Spot
//
//  Drives the first-run onboarding flow. Collects the rider's name, email,
//  phone, skill level, and weekly riding frequency across a few steps, then
//  writes a `Profile` into the app environment and marks onboarding complete.
//
//  Pure state + navigation logic; the view renders each step.
//

import Foundation
import Observation

@MainActor
@Observable
final class OnboardingViewModel {

    /// Ordered steps of the flow. `welcome` is the intro; the rest collect data.
    enum Step: Int, CaseIterable {
        case welcome
        case name
        case email
        case phone
        case skill
        case frequency

        /// The question-collecting steps (excludes the welcome screen), used to
        /// compute progress through the form.
        static var formSteps: [Step] { allCases.filter { $0 != .welcome } }
    }

    private(set) var step: Step = .welcome

    // MARK: - Draft fields (bound to the inputs)

    var name = ""
    var email = ""
    var phone = ""
    var skill: BikingSkill?
    var frequency: RideFrequency?

    // MARK: - Progress

    /// 0...1 progress across the FORM steps (welcome contributes 0).
    var progress: Double {
        guard step != .welcome else { return 0 }
        let total = Double(Step.formSteps.count)
        let index = Double((Step.formSteps.firstIndex(of: step) ?? 0) + 1)
        return index / total
    }

    var isFirstStep: Bool { step == .welcome }
    var isLastStep: Bool { step == Step.allCases.last }

    /// Whether the current step's input is valid enough to advance.
    var canAdvance: Bool {
        switch step {
        case .welcome:   return true
        case .name:      return !name.trimmingCharacters(in: .whitespaces).isEmpty
        case .email:     return isValidEmail(email)
        case .phone:     return isValidPhone(phone)
        case .skill:     return skill != nil
        case .frequency: return frequency != nil
        }
    }

    // MARK: - Navigation

    func advance() {
        guard canAdvance else { return }
        let next = min(step.rawValue + 1, Step.allCases.count - 1)
        step = Step(rawValue: next) ?? step
    }

    func back() {
        let prev = max(step.rawValue - 1, 0)
        step = Step(rawValue: prev) ?? step
    }

    /// Build the profile and persist it, flipping the environment to the main app.
    func finish(into environment: AppEnvironment) {
        // Preserve any existing emergency contact / id already on the profile.
        var profile = environment.profile
        profile.displayName = name.trimmingCharacters(in: .whitespaces)
        profile.email = email.trimmingCharacters(in: .whitespaces)
        profile.phone = phone.trimmingCharacters(in: .whitespaces)
        profile.skillLevel = skill
        profile.weeklyFrequency = frequency

        environment.profile = profile
        environment.hasCompletedOnboarding = true
    }

    // MARK: - Lightweight validation

    private func isValidEmail(_ value: String) -> Bool {
        // Good-enough check for onboarding: something@something.tld
        let trimmed = value.trimmingCharacters(in: .whitespaces)
        let pattern = #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#
        return trimmed.range(of: pattern, options: .regularExpression) != nil
    }

    private func isValidPhone(_ value: String) -> Bool {
        // Require at least 7 digits; ignore spaces, dashes, parens, +.
        let digits = value.filter(\.isNumber)
        return digits.count >= 7
    }
}
