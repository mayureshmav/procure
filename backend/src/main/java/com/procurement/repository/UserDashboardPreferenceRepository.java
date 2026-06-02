package com.procurement.repository;

import com.procurement.model.UserDashboardPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserDashboardPreferenceRepository extends JpaRepository<UserDashboardPreference, Long> {
    Optional<UserDashboardPreference> findByUserId(Long userId);
}
