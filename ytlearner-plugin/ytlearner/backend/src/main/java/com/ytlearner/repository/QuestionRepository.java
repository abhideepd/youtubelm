package com.ytlearner.repository;

import com.ytlearner.model.QuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<QuestionEntity, String> {
    List<QuestionEntity> findByVideoId(String videoId);
}
