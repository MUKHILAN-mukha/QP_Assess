import React from 'react';

const FullExamTemplate = ({ paperData }) => {
    if (!paperData) return null;

    let data;
    try {
        data = typeof paperData === 'string' ? JSON.parse(paperData) : paperData;
    } catch (e) {
        return <div className="error-banner">Error parsing the generated paper. It may not be in valid JSON format.</div>;
    }

    const { metadata, course_outcomes, part_a, part_b } = data;

    return (
        <div className="exam-paper-container" style={{
            background: 'white', color: 'black', padding: '1in',
            fontFamily: '"Times New Roman", Times, serif',
            maxWidth: '800px', margin: '0 auto',
            lineHeight: '1.4'
        }}>
            {/* Header Section */}
            <div className="header-section" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Roll Number: _________</span>
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.2rem 0' }}>St. Xavier's Catholic College of Engineering, Chunkankadai, Nagercoil \u2013 629 003</h2>
                <h3 style={{ fontSize: '1.1rem', margin: '0.2rem 0' }}>{metadata.exam_name}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0', fontWeight: 'bold' }}>
                    <span>Time: {metadata.time}</span>
                    <span style={{ textAlign: 'center' }}>
                        Class: {metadata.class_name}<br />
                        {metadata.subject_code} \u2013 {metadata.subject_name}
                    </span>
                    <span>Maximum: {metadata.max_marks}</span>
                </div>
            </div>

            {/* Course Outcomes */}
            <div className="co-section" style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 'bold' }}>Course Outcomes (COs)</div>
                {course_outcomes && course_outcomes.map((co, idx) => (
                    <div key={idx} style={{ marginLeft: '1rem' }}>{co}</div>
                ))}
                <div style={{ fontStyle: 'italic', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    CL-Cognitive Level; Re-Remember;Un-Understand;Ap-Apply;An-Analyze;Ev-Evaluate;Cr-Create;
                </div>
            </div>

            {/* Table Header Structure */}
            <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '5%' }}>Q.<br />No.</div>
                <div style={{ width: '75%', textAlign: 'center' }}>Question</div>
                <div style={{ width: '10%', textAlign: 'center' }}>Marks</div>
                <div style={{ width: '5%', textAlign: 'center' }}>CL</div>
                <div style={{ width: '5%', textAlign: 'center' }}>CO</div>
            </div>

            {/* Part A */}
            <div className="part-a-section" style={{ marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '1rem 0' }}>
                    Part-A (9 x 2 = 18 marks)
                </div>
                {part_a && part_a.map((q, idx) => (
                    <div key={idx} style={{ display: 'flex', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '5%' }}>{q.q_no}.</div>
                        <div style={{ width: '75%', paddingRight: '1rem' }}>{q.question}</div>
                        <div style={{ width: '10%', textAlign: 'center' }}>{q.marks}</div>
                        <div style={{ width: '5%', textAlign: 'center' }}>{q.cl}</div>
                        <div style={{ width: '5%', textAlign: 'center' }}>{q.co}</div>
                    </div>
                ))}
            </div>

            {/* Part B */}
            <div className="part-b-section">
                <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '1rem 0' }}>
                    Part-B (2 x 16 = 32 marks)
                </div>
                {part_b && part_b.map((q, idx) => (
                    <React.Fragment key={idx}>
                        {/* Option A */}
                        <div style={{ display: 'flex', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '5%' }}>{q.q_no}.</div>
                            <div style={{ width: '75%', paddingRight: '1rem' }}>
                                <div style={{ display: 'flex' }}>
                                    <span style={{ marginRight: '0.5rem' }}>{q.option_a.sub_q}</span>
                                    <span>{q.option_a.question}</span>
                                </div>
                            </div>
                            <div style={{ width: '10%', textAlign: 'center', alignSelf: 'flex-end' }}>{q.option_a.marks}</div>
                            <div style={{ width: '5%', textAlign: 'center', alignSelf: 'flex-end' }}>{q.option_a.cl}</div>
                            <div style={{ width: '5%', textAlign: 'center', alignSelf: 'flex-end' }}>{q.option_a.co}</div>
                        </div>

                        {/* OR Separator */}
                        <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '0.5rem 0' }}>OR</div>

                        {/* Option B */}
                        <div style={{ display: 'flex', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '5%' }}>{q.q_no}.</div>
                            <div style={{ width: '75%', paddingRight: '1rem' }}>
                                <div style={{ display: 'flex' }}>
                                    <span style={{ marginRight: '0.5rem' }}>{q.option_b.sub_q}</span>
                                    <span>{q.option_b.question}</span>
                                </div>
                            </div>
                            <div style={{ width: '10%', textAlign: 'center', alignSelf: 'flex-end' }}>{q.option_b.marks}</div>
                            <div style={{ width: '5%', textAlign: 'center', alignSelf: 'flex-end' }}>{q.option_b.cl}</div>
                            <div style={{ width: '5%', textAlign: 'center', alignSelf: 'flex-end' }}>{q.option_b.co}</div>
                        </div>
                    </React.Fragment>
                ))}
            </div>

        </div>
    );
};

export default FullExamTemplate;
