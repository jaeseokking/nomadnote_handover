import { BannerAd, BannerAdSize, TestIds } from '@react-native-firebase/admob';

const AdBanner = () => (
    <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.SMART_BANNER}
        requestOptions={{
            requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={function () {
            console.log('Advert loaded');
        }}
        onAdFailedToLoad={function (error) {
            console.error('Advert failed to load: ', error);
        }}
    />
);

export default AdBanner;