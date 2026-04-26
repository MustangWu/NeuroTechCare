-- 1. PATIENT TABLE
CREATE TABLE IF NOT EXISTS PATIENT (
    patient_id          VARCHAR(50) PRIMARY KEY, 
    name                VARCHAR(100) NOT NULL,
    age                 INTEGER NOT NULL CHECK (age > 0 AND age < 131),
    gender              VARCHAR(20) NOT NULL,
    cache_session_id    INT
);


-- 2. RECORDING TABLE
CREATE TABLE IF NOT EXISTS RECORDING (
    recording_id        INT PRIMARY KEY,
    upload_timestamp    TIMESTAMPTZ DEFAULT NOW(),
    text_transcript     TEXT,
    patient_id          VARCHAR(50) NOT NULL, 

    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id)
);


-- 3. BIOMARKER_ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS BIOMARKER_ANALYSIS (
    analysis_id          SERIAL PRIMARY KEY,
    MLU_score            FLOAT,
    pause_ratio          FLOAT,
    type_token_ratio     FLOAT,
    filler_word_count    INT,
    syntactic_complexity FLOAT,
    analysis_timestamp   TIMESTAMPTZ DEFAULT NOW(),
    recording_id         INT,
    risk_id              INT,
    patient_id           VARCHAR(50) NOT NULL,

    FOREIGN KEY (recording_id) REFERENCES RECORDING(recording_id),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id),
--  FOREIGN KEY (risk_id) REFERENCES RISK_ASSESSMENT(risk_id)
--  Removed the foreign key from biomarker_analysis to risk_assessment to avoid a circular dependency. 
--  Keeping both directions would make data insertion difficult, since each table would depend on the other existing first.
);


-- 4. RISK_ASSESSMENT TABLE
CREATE TABLE IF NOT EXISTS RISK_ASSESSMENT (
    risk_id             INT PRIMARY KEY,
    dementia_risk_level VARCHAR(50),
    confidence_score    FLOAT,
    trend_direction     VARCHAR(50),
    analysis_id         INT,

    FOREIGN KEY (analysis_id) REFERENCES BIOMARKER_ANALYSIS(analysis_id)
);


-- 5. INSERT INTO PATIENT
INSERT INTO PATIENT (patient_id, name, age, gender, cache_session_id) VALUES
('PT-2024-001', 'Aileen Hernandez', 72, 'Female', 1001),
('PT-2024-002', 'B B King', 75, 'Male', 1002),
('PT-2024-003', 'Charmian Carr', 73, 'Female', 1003),
('PT-2024-004', 'David Prowse', 80, 'Male', 1004),
('PT-2024-005', 'Evelyn Keyes', 78, 'Female', 1005),
('PT-2024-006', 'Jesse Helms', 79, 'Male', 1006),
('PT-2024-007', 'Maurice Hinchey', 76, 'Male', 1007),
('PT-2024-008', 'Omar Sharif', 82, 'Male', 1008),
('PT-2024-009', 'Stella Stevens', 77, 'Female', 1009),
('PT-2024-010', 'Viv Nicholson', 74, 'Female', 1010);


-- 6. INSERT INTO RECORDING
-- The recording timestamps are assigned according to the audio file naming convention,
-- which represents recordings from different time periods. 
-- The intervals between timestamps are intentionally set (e.g., 3–4 years apart) to reflect temporal progression, rather than being randomly generated.
INSERT INTO RECORDING (recording_id, upload_timestamp, text_transcript, patient_id) VALUES
-- Aileen Hernandez
(1, '2015-06-15 10:00:00',
'Well this is not gonna sound like very ladylike and what my mother did was she took me by the hand, she took me down to the person who had come up with this idea of having a petition, and she walked right in and into the kitchen and she said to him, "What, what made you decide that you should have us not living in this neighborhood? Who are you to make that decision?" So part of it I learned very quickly that if you''ve got an issue, you better start speaking up very early on it. What was nice about the end of it was the, the, uh, principal at the school called all of the people together and told them that if they tried to get us out of the ne- out of the neighborhood, he would make sure that we could go into his house and we could still stay there.',
'PT-2024-001'),         --Just after symptom onset 
(2, '2020-08-20 11:30:00',
'I arrive at my first political science class. The teacher looks down at me, and then he says, "If you are not prepared to do all of the work that we''re talking about, I would suggest that you leave now and sign up for home economics." And I look around, and for the first time, I discover I''m the only girl in the room. I would not move ''cause I knew my mother would not, never forgive me if I did. [laughs] I did very well in college, and I saw an ad that said, "Would you like a job that doesn''t pay a lot of money but gives lots of satisfaction to you in terms of what you''re doing in the society?" And I said, "They''re talking to me."',
'PT-2024-001'),         --5 years after symptom onset  
(3, '2020-10-10 09:45:00',
'We are more conscious in this state now about the places where inequity ex- ac- actually exist, and we do try to pass laws, and we do see some changes. I can remember, for example, when the, the issues around disability first came into play, and people said, "This is incredible. We can''t do all of these things. It will cost a fortune for us to do it." And what these things were, was such things as how do we make sure that people in wheelchairs can get up on a sidewalk and, or get into an elevator or do any of those things. And this was horrifying to people. It was gonna cost fortunes to, you know, to carve out all these curbs so that you could get people on their, on their wheelchairs in there. Well, what has turned out to happen is that by doing that for what was considered, quote, "a small group of people," we have incredibly improved the ability of a lot of other people to use them as well. For example, any parent who has a child in a stroller is now using those curbed, those carved-out curbs. They would not have been able [chuckles] to do that before, but they found it works. So it didn''t just help a small group of people. Once it was done, it opened up a lot of groups of people. I''m sure that any delivery company that has to deliver also appreciates those curbs being carved out. And we''ve also learned that w-- our stereotypes begin to fall away once we have the experience with them because we have found that we have lost a lot of ti-',
'PT-2024-001'),         --5 years after symptom onset  


-- B B King
(4, '2008-05-12 14:20:00',
'When I''m feeling bad, and good for me when I''m feeling good. Mm-hmm. It''s kinda like religious music is to a lot of people.',
'PT-2024-002'),         --Just after symptom onset  
(5, '2018-07-18 10:15:00',
'Anyone else other than I was a Black kid instead of being a white kid, and it was a segregated society. Um, we walked to school. The white kids had a school bus. And, um, I was crazy about Roy Rogers. I like, uh, William Elliott, we called him Wild Bill. I didn''t think I''m being white. [laughs] Those cowboys were my heroes. Uh, I think trying to answer your question, I had never experienced the North. I didn''t know anything about the North. I didn''t know anything about any other society other than what we lived in. So to answer your question, truthfully, it was all right with me. Just that some people had and some had not, and I wished I could have been one of those that had. Now that''s the truth. Well, I, I guess I was an average, uh, Afro-American boy, or American boy, really. Um, I used to hunt, fish, um, played. I''d shoot marbles, was never good at any of it. Um, the school I went to, we didn''t have a football team or basketball team. Um, we played something called',
'PT-2024-002'),         --10 years after symptom onset 
(6, '2023-09-05 16:40:00',
'No, not necessarily when I was doing the music. I''m talking about at times, just times in your life... times in your life you feel that, for example, you might lose a close friend or something happens that doesn''t necessarily have to be bad for you, but bad for somebody else. Bad in a lot of cases for people you don''t even know, and you still feel, you know, uh, empty in a way of speaking. Mm-hmm... ''cause you can''t do anything to help them. You don''t know, uh, well, you''re just, you''re just there. Yeah. For example, a few, what? A month ago or so, I was in Europe and I read about JFK Jr. Right. Well, I had a chance to meet him when he was a teenager. Mm-hmm. His mother brought he and his sister by. We were playing in Manhattan one night and, uh, the ex First Lady at that time, it was after the president was dead, brought the kids by where we were playing, so I had a chance to see him, meet him. And then reading about he and his wife and sister-in-law were all killed at one time, this hurt. Yeah, I think... Uh, it would have hurt me if I had not met him. But I had met him.',
'PT-2024-002'),         --15 years after symptom onset 


-- Charmian Carr
(7, '2013-04-22 13:10:00',
'The first thing that was shot on Sound of Music was my scene where I am all wet and come into the window to see Maria. And I was supposed to be nervous ''cause I didn''t want her to tell on me. And so I was nervous anyway [laughs] so it just worked to the benefit of the film. And Julie Andrews was so kind to me and wonderful with the children. She would tell us jokes, and she made it much easier. In fact, when I watched the new DVD, I watched Julie Andrews'' segment, and at the end of her segment, the tears were rolling down my eyes. I mean, it was very nostalgic. The tears are gonna roll down my eyes again. [laughs] I''m sorry. But it''s been a wonderful, wonderful-',
'PT-2024-003'),         --5 years after symptom onset
(8, '2023-06-18 15:25:00',
'One of those things that I was definitely in the right place at the right time. They had actually been looking for an actress to play Liesl for months. They had interviewed in New York, London, and LA and couldn''t find anyone. They started rehearsals without Liesl. And my mother was in Vaudeville, and an agent friend of hers knew she had three daughters and said, "Do you have one daughter who''s over 18, who looks 16, and can sing and dance and act?" [laughs] They wanted an actress over 18 because they didn''t want her to have to go to school on the set, ''cause the role of Liesl was larger than that of the other children and they didn''t wanna lose that time every day. So I went in, I met the casting agent. There was nobody there. I, I couldn''t get nervous and I couldn''t compare myself to anyone ''cause there was no one there, and I didn''t know about The Sound of Music. I had never seen the play, and I hadn''t really been clamoring to be an actress. I was working and going to college and saving money to travel. And I met with the casting director and he had me come back the next day and read the 16 Going On 17 scene, which I did. And then he called me back again, and I met the director and read the scene for him. And then I had to come back the next day to sing 16 Going On 17. And my mother and father both sang. It''s just a genetic quality that I''ve inherited. Aren''t you lucky? Our whole family sings. So I sang 16 Going On 17, and then they called me back the next day and I danced for the choreographers. And I had studied dance since the time I was four, so that was the easy part of it. And I was hired, but I was only hired temporarily. They were afraid that my eyes were too blue and would not photograph well. This was in the days before they could digitize anything.',
'PT-2024-003'),         --15 years after symptom onset


-- David Prowse
(9, '2012-02-14 12:00:00',
'Now I play the Imperial March. [laughs] I think that would probably be one of the last things that I would play. I''m lumbered with the situation. I mean, it''s, uh, um, I''m still, I''m still, uh, sort of being ostracized, as it were. I mean, silly things like, you know, for instance, um, they''ve stopped me from doing the Disney Star Wars weekends. I used to love doing the Disney Star Wars weekends, and it was a sort of lovely, lovely job to have every year out in Florida. And then, uh, I mean, that''s one thing which they put the block on. Um, and other things have cropped up which they haven''t, you know, or have stopped me from doing and, uh, yeah.',
'PT-2024-004'),         --Just after symptom onset
(10, '2017-03-22 11:50:00',
'My brother had a prostate first. And, uh, we organized a charity golf tournament for, you know, in aid of the prostate charity. And, uh, we raised about 1,000 pounds for the charity. And when I presented the check to the lady from the prostate cancer charity, uh, she said to me, "Have you ever been tested?" And I said, "No, no, I''m perfectly all right, thank you very much. There''s nothing wrong with me." And, uh, so then she said, "Well, all men over 50 ought to be tested." And, uh, so the next time I went to see my doctor, I said, "Do me a favor. Can you give me a chit, um, to go and get a blood test done?" I had the blood test done. Next thing I know, uh, they called me up and said that, "We wanna do a biopsy." And they did the biopsy, took 12 samples, and then came back and they said, "Well, 10 of the samples that you had, uh, were suspicious. Um, in other words, you''ve got prostate cancer [laughs]." Gosh. And, uh, so they said, "How would you want it treated?" And I said, "Well, what''s the options?" And, uh, I opted to go for the radiotherapy. And so I had, uh, 39 sessions of radiotherapy at the Royal Marsden Hospital in Sutton. Wow. And at the end of it, that was the end of it.',
'PT-2024-004'),         --5 years after symptom onset
(11, '2022-07-30 10:30:00',
'I did this, um, uh, Stanley Kubrick rang me up one day and said he was doing this film, A Clockwork Orange, and asked me if I would go up to this house in, um, I think it was in North London. And, uh, we filmed this terrible movie [laughs]. It was quite strange actually because the first scene I did, I was doing nothing else but carrying Alex, who was Malcolm McDowell, down the stairs. I did it all day long, non-stop, and at the end of the day I could hardly move my arms. Then Stanley said the next day, "We''re gonna do this scene where you''re going to carry Patrick Magee down the stairs in his wheelchair." I said, "Hang on a minute. Your name''s not One Take Kubrick, is it?" And he said, "Oh, we do it as quick as we can." And we shot the scene in about three or four takes. He was a hard taskmaster to work for, but a lovely guy. I got on very well with him. And then, of course, that came out in 1971, I think. And luckily for me, George Lucas saw it, because it created a lot of publicity over the content of the film. And Lucas saw it in that brief period and remembered me for five years, then came to London and got in touch with the managing director and said, "Can you find me this guy, Dave Prowse?" And then I got called in.',
'PT-2024-004'),         --10 years after symptom onset 


-- Evelyn Keyes
(12, '2011-01-10 09:20:00',
'To go through... Well, I was under contract. He was on the Paramount lot. Mm-hmm. He had his special, mm, place over there, his bungalow and everything. Made pictures through. So I was on the Paramount lot, and they had schools. I went to all kinds of schools. I got rid of the accent there. I learned to act. They had a stage. You would do... you wouldn''t do whole plays, you''d do pieces of plays. Right. So that''s where I went to, where I learned my-',
'PT-2024-005'),         --Just after symptom onset
(13, '2021-05-18 14:10:00',
'Well, there''s no other way anymore. I mean, I''ve read Truman Capote, and I''ve read Erica Jong, and there''s a new era. I mean, there''s no way you could tell a story without going all out. And I was invited, with money, to do the autobiography, and I don''t... Well, who... Evelyn Keyes, who the hell is she? Who remembers? And if anybody remembers, who cares? So with that half-baked career I had, you know, that wasn''t very interesting, and that wouldn''t be much of a story. So what do I have to offer? A dream. It''s an American dream of rather a large number of us, uh, to go to Hollywood and be a star. Mm? Uh, and then what happens? You know, it looks good from a distance. Then you get there, and how do I clean this up? All things break loose-',
'PT-2024-005'),         --10 years after symptom onset 


-- Jesse Helms
(14, '2010-02-10 10:00:00',
'Nine years ago, someone handed me a clipping quoting a 1973 statement by a longtime friend of a great many of us, Senator Sam J. Ervin Jr. Senator Ervin is now deceased, of course. Dot Helms suggested, well, instructed may be a better word, that I share it with you on an appropriate occasion, and this is it. It was six days before Christmas in 1973, and unless Senator Ervin were to run again in 1974, his Senate career would end on January third, 1975. It was on that December day that Senator Ervin issued a public statement that ended speculation as to whether he would or would not seek re-election. Now, Senator Ervin did not run again in 1974, and he later explained it this way, and I''m quoting. He said, "There''s one inescapable reality that no man can ignore, and that is that time takes a terrific toll, which is of an increasing nature with those who live many years." End of quote. And then Senator Ervin added, "I would hate to be in the Senate and have to, in Kipling''s words, force my heart and nerves and sinew to serve-"',
'PT-2024-006'),         --Just after symptom onset
(15, '2015-06-22 11:30:00',
'For Mexico never existed. And the fact... Uh, I''m very fond of Mexico. I have, uh, disliked some things, uh, positions taken by the government of Mexico in the past. And yes, uh, I try to be candid as a United States Senator, and I have told the truth about my feelings. But there''s a new day, there''s a new day in Washington and a new day here. We have two new great presidents.',
'PT-2024-006'),         --5 years after symptom onset
(16, '2015-09-14 15:20:00',
'I would like for them to say, "Well, he did the best he could." If they say that, uh, that''d be enough.',
'PT-2024-006'),         --5 years after symptom onset


-- Maurice Hinchey
(17, '2009-01-15 10:30:00',
'Very much, and it''s a great pleasure for me to be here with all of you, and I really thank you very much for being here with us. Thank you for bringing us here and giving us an opportunity to see the operation more closely and to understand, for example, all the progress that you''ve made, including the fifty percent increase in employment here over the course of the last year or so. Obviously, very important. Elma Magnetics is a very important place here in the Hudson Valley, and it''s going to continue to expand because of all the positive things that it''s doing, including the military operations in our country. I also want to express my deep appreciation to Senator Gillibrand. She is a great person. We are very fortunate here in New York to have somebody with as much insight, intelligence, energy, and determination to do the right kinds of things. Job creation is one of the most important things that we need to focus on. We have eight point two percent unemployment here in New York, which is slightly better than other places across the country.',
'PT-2024-007'),         --Just after symptom onset
(18, '2009-04-20 11:10:00',
'Understand what the obligations and mostly the responsibilities are of this new circumstance in this job, this job of representing the people here in the Congress of the United States.',
'PT-2024-007'),         --Just after symptom onset
(19, '2014-08-12 14:45:00',
'A few words in favor of what is attempting to be done here in the context of this bill. The TARP situation, which as we remember was set up last fall, authorized the expenditure of seven hundred billion dollars. Under the last administration, about three hundred and eighty billion dollars had already been spent. What we are trying to do now is to make sure that the rest of this money is spent appropriately. We have already set up the Special Inspector General, establishing that responsibility. Now we are putting into effect measures that ensure the effectiveness of that role, to oversee how this money is allocated, how it is used, and what impact it has. None of that was included in the original TARP bill. This legislation is critically important, and we need to make certain that these economic circumstances are dealt with appropriately.',
'PT-2024-007'),         --5 years after symptom onset


-- Omar Sharif
(20, '2012-03-12 09:40:00',
'He made me become somebody. I was good, I could play and all that, but to be next to him, to be near him, he made me fantastic. I used to just sit with him and he would make me better. Mm. Yes.',
'PT-2024-008'),         --Just after symptom onset
(21, '2022-06-25 13:15:00',
'And it''s... he is a strange person because he sits there and only exists when the boy walks in. He doesn''t talk to the other customers. The fact that the boy is Jewish and the man is Muslim would be irrelevant to the film. The story is not concerned with that problem itself. It becomes relevant because of the conflict between Israelis and Palestinians, and also the broader conflict between Islam and the rest of the world. We are moving toward a very dangerous situation, a real conflict of cultures, civilizations, and religions. The powerful Western countries are often seen as supporting Israel against the Palestinians. I''m not saying that... but before solving the conflict, both Sharon and Arafat would have to go. They are incompatible people who have hated each other for a long time, and they are not going to suddenly start cooperating or making agreements together.',
'PT-2024-008'),         --10 years after symptom onset


-- Stella Stevens
(22, '2007-02-18 10:10:00',
'I started doing this about four years ago, I think, and I''ve accumulated a lot of photographs because the collectors have given me some. So now you''re a collector. And then I''m not [laughs]. I''m a collector and also a kind of a dealer in that I always have photos available for my fans, and every year I try to make a new pin-up because I''m one of the top pin-ups in the world. Yes. And it''s been a difficult thing to be a serious actress and a pin-up because there are two different worlds, and it''s a funny thing.',
'PT-2024-009');         --15 years after symptom onset


-- Viv Nicholson
(23, '2006-05-14 11:30:00',
'I did it. Instead of just saying he''s dead. Yeah. Just dramatically. Dramatic. And I went in, and there was blood all over the place. All of it. And because his Uncle Frank was in as well with him. And Uncle Frank, he got hit, and his back was broken, and he crawled out of the car to go and get help. And he was bleeding all over. And it was terrible. And, um, they put this thing over his head. So I was just trying to talk to Keith, you know, and someone said, "Don''t touch that." And I didn''t realize they''d taken everything out here, you see. And I''m just thinking, "You... you did this purposely, because why didn''t you tell me you didn''t want me?" You know, because you blame yourself. Why didn''t you tell me? Because I said I would have left you. I wouldn''t have stayed. But I didn''t really, because it takes two to tango, doesn''t it? And he didn''t answer me. And I couldn''t touch him. No one could touch him. And his uncle, his spine had gone straight through his back, and there was blood everywhere because they couldn''t stop it until they arrived.',
'PT-2024-010');         --5 years after symptom onset