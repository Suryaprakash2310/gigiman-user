import { ServiceAPI } from "@/src/api/service.api";
import ServiceCategoryCard from "@/src/components/ServiceCategoryCard";
import AppHeader from "@/src/components/ui/AppHeader";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServiceCategory({ route, navigation }: any) {
  const { serviceName, domainId } = route.params;
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  //const styles = createStyles(theme);
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    if (domainId) {
      const res = await ServiceAPI.getSubServicesByDomainId(domainId);
      const services = res?.services || [];
      const svc = services.find((s: any) => s.serviceName === serviceName);
      const cats = svc?.serviceCategory || [];
      setCategories(cats);
      setLoading(false);
      return;
    }

    // fallback to legacy endpoint shape
    const res = await ServiceAPI.getSubServicesAPI();
    const filtered = (res.categoriesservices || []).filter(
      (c: any) => c.parentServiceName === serviceName
    );
    setCategories(filtered);
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <AppHeader showBack title={serviceName} />

      <ScrollView>
        {loading ? null : categories.map((cat) => (
          <ServiceCategoryCard
            key={cat._id}
            title={cat.serviceCategoryName}
            subtitle={cat.description}
            amount={cat.price}
            image={cat.servicecategoryImage}
            onPress={() =>
              navigation.navigate("Booking", {
                serviceCategoryId: cat._id,
              })
            }
          />

        ))}
      </ScrollView>
    </View>
  );
}


// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//   },
//   scroll: {
//     paddingBottom: 40,
//   },
//   heroCard: {
//     marginHorizontal: 16,
//     marginTop: 16,
//     marginBottom: 24,
//     borderRadius: 24,
//     borderWidth: 1,
//     borderColor: 'transparent',
//     overflow: 'hidden',
//     // --- Corrected Shadow ---
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.8,
//     shadowRadius: 20,
//     elevation: 7,
//   },
//   heroImagePlaceholder: {
//     height: 160,
//     width: '100%',
//   },
//   heroContent: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//   },
//   heroTitle: {
//     marginBottom: 4,
//   },
//   servicesList: {
//     paddingHorizontal: 16,
//   },
// });
