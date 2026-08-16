-- Marketing content (tagline, description, highlights) for the next batch of
-- courses, transcribed from the org's existing course flyers. Same columns
-- added in 0018 — just filling them in for more courses.

update courses set
  tagline = 'discover the magic of color pranas',
  description = 'Once you have learned the fundamentals of Pranic Healing, this course will deepen your learning and skills. At the advanced level, you are taught the power and purpose of color prana for gaining better results, especially in treating severe illnesses. Using color prana, you become a specialist instead of a general practitioner.',
  highlights = array[
    'The use of different colors of prana to heal severe ailments like cancer, diabetes, and glaucoma',
    'The use of special color pranas to create a pranic anesthesia that will help relieve pain',
    'Strengthen the immune system using the different colors by energizing the lymphatic system, blood, liver, and kidneys',
    'Advanced techniques on accelerating the regeneration of fresh wounds, facilitating rapid tissue growth',
    'Techniques to disintegrate kidney stones, gall bladder stones, cysts, and tumors',
    'Techniques to normalize blood pressure, blood sugar, heart rate, and kidneys',
    'Use of Pranic Healing in preventing the growth and propagation of cancer cells',
    'Techniques to prevent miscarriage and help ease the childbirth process',
    'Normalizing and regenerating techniques for damaged organs',
    'Complementary healing techniques for Cleansing the Blood, Cleansing Internal Organs, Master Healing, and Super Healing Techniques',
    'The use of instructive and divine healing to speed up the recovery process',
    'Enlightening on preventive healing to maintain healthier living',
    'Use of spiritual technologies in facilitating miraculous healing'
  ]
where code = 'APH';

update courses set
  tagline = 'the power to control the cause',
  description = 'Besides healing the physical body, Pranic Healing also deals with the psychological state of a person. Pranic Psychotherapy bridges the gap between the mind, the physical body, and the human energy system.',
  highlights = array[
    'Usage of advanced Pranic Healing techniques to treat psychological disorders like stress, depression, phobias, and suicidal tendencies, among others',
    'Healing negative habits like smoking, drug addiction, and alcoholism',
    'Techniques that can transmute destructive or negative entities of compulsive and obsessive behavior',
    'Pranic Healing techniques that will normalize sexual energy and prevent impotence, infertility, and sexual violence',
    'Techniques of auric and chakral shielding to protect you and other people from harmful psychic attacks',
    'Pranic Healing techniques that can help prepare a baby to be healthy before being born',
    'Methods to help prepare a dying person for a peaceful and dignified death',
    'Techniques to externalize negative entities and elementals to create a positive self-image',
    'The use of Pranic Healing for practical applications like healing and enhancing relationships at home or at work'
  ]
where code = 'PSY';

update courses set
  tagline = 'discover the power of crystals',
  description = 'In medicine, it is important for a doctor to be knowledgeable in the use of different medical devices. The same principle can be applied in Pranic Healing. Sometimes, you need special tools to be able to intensify the effect for healing treatments. Crystals are known to be great conduits for energy.',
  highlights = array[
    'The essential properties of crystals',
    'Techniques in processing and using crystals for Pranic Healing',
    'Instantly increasing healing powers through the use of crystals',
    'Cleansing, charging, and programming crystals for healing physiological ailments',
    'The use of crystals to serve as anchors of peace and harmony in relationships, prosperity and success at work and at home'
  ]
where code = 'PCH';

update courses set
  tagline = 'the journey within',
  description = 'Ancient meditations, kept secret for centuries, are revealed and taught to the public for the first time.

These techniques allow you to accelerate the union of your incarnated soul (often described as the personality or lower self) with your Higher Soul (Higher Self). This phenomenon is known as Soul-Realization, Enlightenment, or Self-Realization.

The Higher Soul is a seed of God''s Divinity within all of us. Through the Higher Soul, we are made in the Image of God! Being One with our Higher Soul, we become One with the ''I AM'' — the Christ, the Nature within all of us. Learn the Inner Secrets of the Blue Pearl, the 12th Chakra, the Medical Caduceus to raise the Kundalini energy, the Silver Cords, and more.',
  highlights = array[
    'Learn to experience peace, calmness, and clarity in the midst of a busy and chaotic work or home environment',
    'Learn how to release old emotional baggage and create positive changes in all your relationships',
    'The use of "words of power" (mantras) to speed up the process of achieving inner stillness',
    'Rekindle your intimacy with your partner through mutual meditation',
    'How to dispose of negative emotional baggage and create positive changes in your relationships',
    'Experience the state of "coming home" and "being one with all"',
    'Undergo the experience of being in "total peace" and expansion of consciousness and awareness within minutes of meditation',
    'Discover the true nature of your soul and your soul''s journey to soul-realization and Divine Oneness',
    'The exact location of the 12th Chakra and understand its function',
    'Experience the inner light and the intense bliss of the Blue Pearl or "Seed of Consciousness" within you',
    'Discover the existence of the energetic seeds in your auric field and how they affect your spiritual, mental, emotional, and physical lives. These energetic DNA recorders contain the blueprints for the formation of your subtle and physical bodies',
    'Increase the size of the "communication cable" between your incarnated soul and your higher soul. Experience your soul in everyday life',
    'Discover the secrets of the Three Silver Cords and the Inner Caduceus, and how it is related to safely awakening the Kundalini Energy within you'
  ]
where code = 'AOHS';

update courses set
  tagline = 'fly to the highest mountains of spirituality',
  description = 'The purpose of Arhatic Yoga is to produce intelligent, compassionate, good hearted, powerful people who will help humanity.

Arhatic Yoga comes from two words: "Arhat," which refers to a highly evolved being or what is called a saint, and "Yoga," which means union. Arhatic Yoga is in fact a synthesis of various yogas that includes powerful meditations, purifications, and breathing techniques integrated into a step-by-step system to rapidly and safely accelerate your spiritual development.

Arhatic Yoga is universal and does not belong to any religion, sect, or nation. The aim of Arhatic Yoga is to enable everyone with various religious backgrounds and beliefs to access the inner teachings, kept secret for centuries. The system has been designed in such a way that makes it possible to pursue the spiritual path while living a "normal life," having a job, a family, and hobbies.',
  highlights = array[
    'Learn to use effective techniques to purify your thoughts and emotions and form your character',
    'Know the 5 pillars of Arhatic Yoga and how they can help you have an amazing spiritual development',
    'How to increase the size of your chakras and aura through meditation',
    'How to develop the ability to remove your weaknesses and convert them into strengths',
    'Meditation techniques to increase your awareness',
    'How to safely awaken the Kundalini'
  ]
where code = 'AYP';

update courses set
  tagline = 'the law of cycles and the 7 rays',
  description = 'A revolutionary approach to successful management of your life and business using esoteric laws.

This innovative workshop, designed by Master Choa Kok Sui, uses a revolutionary approach for the success and financial prosperity of businesses, giving a modern and friendly image to management. By using energy and spiritual laws, the realization of plans and projects and overall implementation of labor relations can be made easier.

A positive organizational environment, increased worker productivity, and good return on investment can be created. Through the use of simple meditation techniques, individuals will develop a sharp mind, increasing their capacity to make accurate decisions and take care of critical business situations.

The course also teaches how to handle situations that generate stress in the workplace, allowing employees to instantly recharge physically and mentally. Attendees will be given quick practical tips to remove "stress and tension energy."

The spiritual empowerment of individuals results in strength, confidence, clarity of goals, and dynamism to handle business situations. The workshop is practical and well-structured, bridging the gap between management and the workforce, and is ideal for business owners, executives, managers, entrepreneurs, and anyone interested in spiritually empowered management.',
  highlights = array[
    'To increase business success and profits using esoteric laws',
    'Stress management with proven breathing and meditation techniques',
    'Rapid and instant physical and mental recharging techniques',
    'To develop a clear and sharp mind through meditations',
    'To create a productive, efficient, and harmonious business/work environment',
    'Effective time management',
    'To improve professional and personal relationships',
    'Management using the Seven Rays (human archetypes and tendencies)'
  ]
where code = 'SBM';

update courses set
  tagline = 'the science of materialization',
  description = 'Material abundance gives you freedom to pursue spiritual goals. Kriyashakti teaches you how to properly harness the power of your thoughts, subtle energies, and your auric field to create a life of prosperity and success both materially and spiritually.

Learn the Science of Materialization through Mind Power and Purification for great success, prosperity, and a balanced life through powerful principles and techniques.',
  highlights = array[
    'Principle of Power through Purification: Disintegrate self-destructive thought forms, vices, negative habits, poverty consciousness, guilt, and fears that hinder prosperity and success',
    'Principle of Power through Purification: Purge old lingering negative programming from childhood and build a network of powerful thought forms to continuously attract prosperity and wealth even as you sleep',
    'Principle of Abundance: Attract good luck and generate prosperity and wealth through the science of tithing and karmic entitlement',
    'Principle of Abundance: Harness the power of thoughts, spoken words, and visualization to magically manifest your wishes',
    'Principle of Abundance: Heal difficult cases, dysfunctional relationships, and harmonize conflicting factors',
    'Principle of Abundance: Build powerful thought forms and get what you really, really want',
    'Principle of Success: Work intelligently towards your goal through constant practice of a special concretizing meditation',
    'Principle of Moderation: Master the habit of spending wisely',
    'Principle of Moderation: Practice the power of saving and investing intelligently'
  ]
where code = 'KRIYA';

update courses set
  tagline = 'the science of directions',
  description = 'Grand Master Choa Kok Sui has revealed the secrets of Feng Shui never before divulged to the general public. In addition to direct knowledge given by his teacher, Mahaguruji Mei Ling, GMCKS enlisted the help of countless clairvoyants to observe the energies of different directions and formations and how they affect your health, wealth, and spirituality.',
  highlights = array[
    'Secret Directional Feng Shui: know the exact origination points on the compass of prosperity energies and spiritual energies. These directional energies are not dependent on one''s birthday or calendar',
    'Use your hands to scan for prosperity and health-giving energies. Feel how the different directions are affecting your finances — you will scan your wallets and checkbooks to validate the teachings',
    'Form Feng Shui: learn how to ascertain the energies of different objects and room formations and how they affect you',
    'Harness the optimum direction in the workplace to charge your finances and business ventures with prosperity energies',
    'Use the optimum direction in your home for enhancing your relationships',
    'Accelerate your spiritual development by meditating with the correct direction',
    'Use the proper pictures, colors, and ornaments to display on your walls — this will create prosperity consciousness in the occupants instantly',
    'Distillation of the world''s secret Feng Shui traditions, revealing hidden teachings from esoteric Feng Shui schools of China, Taiwan, the Philippines, and India',
    'Use special mirrors to increase the prosperity energies of rooms, and learn which mirrors to use to expel poverty and draining energies',
    'Learn to absorb and retain massive amounts of prosperity energies in your aura from places that exude success and abundance',
    'Learn which directions will activate your higher chakras to facilitate meditation and healing, and which directions will activate your lower chakras for financial abundance',
    'Learn what direction you should be facing during a business negotiation to optimize your chances of closing the deal and achieving success'
  ]
where code = 'PFS';
