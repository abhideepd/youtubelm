package com.ytlearner.repository;

import com.ytlearner.model.QuizResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResultEntity, String> {
    List<QuizResultEntity> findByUsername(String username);
    List<QuizResultEntity> findByVideoId(String videoId);
}
