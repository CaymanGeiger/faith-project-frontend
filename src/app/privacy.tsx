import { Pressable, Text, View } from 'react-native';
import { LegalCopy, LegalScreen, LegalSection } from '../features/legal/LegalScreen';
import { openExternalUrl } from '../lib/openExternalUrl';

const supportPhoneUrl = 'tel:18003565350';
const herculesWebsite = 'https://www.herculesindustries.com/';

export default function PrivacyNoticeScreen() {
  return (
    <LegalScreen title="Privacy Notice">
      <View className="gap-1 rounded-[16px] border border-hercules-blue/15 bg-hercules-blue/5 p-4">
        <Text className="text-sm font-bold text-hercules-ink">
          Effective August 17, 2026
        </Text>
        <LegalCopy>
          This notice explains how Hercules Industries, Inc. handles information in
          the Hercules Honors Rewards business app.
        </LegalCopy>
      </View>

      <LegalSection title="Information we collect">
        <LegalCopy>
          We collect the account and business details you provide: name, email
          address, optional phone number, company name, and an internal account
          identifier. We also process account credentials as a protected password
          hash.
        </LegalCopy>
        <LegalCopy>
          To provide the app, we process training enrollment and onboarding
          activity, equipment names, model and serial numbers, marketing
          consultation availability, manager lead notes, and private messages
          between assigned dealers and sales managers.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="How we use and share information">
        <LegalCopy>
          Hercules Industries, Inc. uses this information to authenticate users, provide dealer
          training and support, manage the assigned manager relationship, operate
          app features, secure the service, and meet legal obligations. We do not
          use this app for advertising, tracking across other companies' apps or
          websites, or selling personal information.
        </LegalCopy>
        <LegalCopy>
          Information is available to the assigned Hercules team members who need
          it to operate the dealer program and to service providers that host or
          secure the application on Hercules' behalf. If a new outside integration
          is added, Hercules will update this notice and the app-store disclosures
          before transferring data.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <LegalCopy>
          You can correct account details in the app. You can request deletion in
          the Profile or Account screen, or on the public Account Deletion page.
          Dealer account data is deleted when the in-app deletion process
          completes. A sales manager deletion request closes access immediately
          and is completed after active dealer relationships are reassigned.
          Hercules aims to complete verified requests within 30 days and will
          confirm when the process is complete.
        </LegalCopy>
        <LegalCopy>
          Hercules may retain limited information only when required by law,
          necessary to resolve a security issue, or needed for an active business
          record that must first be reassigned. The applicable deletion request is
          tracked until completion.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Security and children">
        <LegalCopy>
          The production service uses authenticated, encrypted connections and
          limits access to authorized business users. The app is intended for
          adult dealers and Hercules personnel; it is not directed to children.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Contact Hercules">
        <LegalCopy>
          For privacy questions, account assistance, or a report about content in
          the app, contact Hercules Industries.
        </LegalCopy>
        <View className="flex-row flex-wrap gap-x-5 gap-y-1">
          <Pressable
            accessibilityRole="link"
            onPress={() => void openExternalUrl(supportPhoneUrl)}
            className="min-h-11 justify-center"
          >
            <Text className="font-bold text-hercules-blue">1-800-356-5350</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => void openExternalUrl(herculesWebsite)}
            className="min-h-11 justify-center"
          >
            <Text className="font-bold text-hercules-blue">
              herculesindustries.com
            </Text>
          </Pressable>
        </View>
      </LegalSection>
    </LegalScreen>
  );
}
