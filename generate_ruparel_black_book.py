import sys
import os

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
    from docx.oxml import OxmlElement, parse_xml
    from docx.oxml.ns import nsdecls, qn
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx"])
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
    from docx.oxml import OxmlElement, parse_xml
    from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(20)
    h.paragraph_format.space_after = Pt(8)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = RGBColor(40, 40, 40)
    return h

def add_body_p(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(space_after)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(11)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0, 0, 0)
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(30, 30, 30)
    return p

def add_bullet_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(4)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(11)
        r_pre.font.bold = True
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(30, 30, 30)
    return p

def create_table(doc, headers, rows_data, col_widths=None):
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "E2E8F0") # Light grey header matching template
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(10.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)

    # Data Rows
    for r_idx, row_values in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        for c_idx, val in enumerate(row_values):
            row_cells[c_idx].text = str(val)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            for r in p.runs:
                r.font.name = 'Calibri'
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(30, 30, 30)

    # Set Column Widths if provided
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return table

def add_code_block(doc, code_text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(30, 41, 59)
    return p

def build_ruparel_black_book(output_path):
    doc = docx.Document()

    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1.25)
        s.right_margin = Inches(1)

    print("Generating Ruparel College Template - Cover Page...")
    # ==================== 1. COVER PAGE ====================
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(10)

    r = p.add_run("A PROJECT REPORT\nOn\n")
    r.font.name = 'Arial'
    r.font.size = Pt(12)
    r.font.bold = True

    r_title = p.add_run("<UCHALA DUMBELL GYM – CLOUD FITNESS & GYM MANAGEMENT SYSTEM>\n\n")
    r_title.font.name = 'Arial'
    r_title.font.size = Pt(15)
    r_title.font.bold = True

    r_sub = p.add_run("Submitted by\n\n")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True

    r_name = p.add_run("Mr. SUJAL MANJREKAR\n\n")
    r_name.font.name = 'Arial'
    r_name.font.size = Pt(13)
    r_name.font.bold = True

    r_degree = p.add_run("in partial fulfillment for the award of the degree\nof\nBACHELOR OF SCIENCE\nin\nCOMPUTER SCIENCE\n\n")
    r_degree.font.name = 'Arial'
    r_degree.font.size = Pt(11)
    r_degree.font.bold = True

    r_guide = p.add_run("under the guidance of\nPROF. PRANJALI CHAUDHARI\nDepartment of Computer Science\n\n")
    r_guide.font.name = 'Arial'
    r_guide.font.size = Pt(11)
    r_guide.font.bold = True

    r_clg = p.add_run("Modern Education Society’s\nThe D. G. Ruparel College of Arts, Science & Commerce\n\n(Sem - V)\n(2026 – 2027)")
    r_clg.font.name = 'Arial'
    r_clg.font.size = Pt(12)
    r_clg.font.bold = True

    doc.add_page_break()

    # ==================== 2. CERTIFICATE ====================
    print("Generating Certificate...")
    p_cert_hdr = doc.add_paragraph()
    p_cert_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_hdr.paragraph_format.space_after = Pt(16)
    r = p_cert_hdr.add_run(
        "Modern Education Society’s\n"
        "The D. G. Ruparel College of Arts, Science & Commerce,\n"
        "senapati bapat marg, opp. Matunga road station (w.r.), mahim, mumbai 400 016\n\n"
        "Department of Computer Science\n\n"
        "CERTIFICATE\n"
    )
    r.font.name = 'Arial'
    r.font.size = Pt(12)
    r.font.bold = True

    add_body_p(doc, "This is to certify that Mr. SUJAL MANJREKAR, Seat no: _________________ of T.Y.B.Sc. (Sem V) class has satisfactorily completed the Mini Project \"Uchala Dumbell Gym – Cloud Fitness & Gym Management System\", to be submitted in the partial fulfillment for the award of Bachelor of Science in Computer Science during the academic year 2026 – 2027.")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(30)
    add_body_p(doc, "Date of Submission: __________________\n")
    doc.add_paragraph().paragraph_format.space_after = Pt(40)

    t_sig = doc.add_table(rows=2, cols=2)
    t_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sig.rows[0].cells[0].text = "_______________________\nProject Guide"
    t_sig.rows[0].cells[1].text = "_______________________\nHead / Incharge,\nDepartment Computer Science"
    t_sig.rows[1].cells[0].text = "\n\n_______________________\nCollege Seal"
    t_sig.rows[1].cells[1].text = "\n\n_______________________\nSignature of Examiner"
    for r in t_sig.rows:
        for c in r.cells:
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.name = 'Calibri'
                run.font.size = Pt(11)
                run.font.bold = True

    doc.add_page_break()

    # ==================== 3. TABLE OF CONTENTS ====================
    print("Generating Table of Contents (Index)...")
    p_toc = doc.add_paragraph()
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_toc.add_run("TABLE OF CONTENTS\n")
    r.font.name = 'Arial'
    r.font.size = Pt(14)
    r.font.bold = True

    toc_rows = [
        ["CERTIFICATE", "2"],
        ["TABLE OF CONTENTS", "3"],
        ["ACKNOWLEDGEMENT", "5"],
        ["ABSTRACT", "6"],
        ["DECLARATION", "7"],
        ["LIST OF ABBREVIATIONS", "8"],
        ["CHAPTER 1: PROBLEM IDENTIFICATION & FEASIBILITY STUDY", "9"],
        ["1.1 Role and Responsibility", "9"],
        ["1.2 Background and Motivation", "10"],
        ["1.3 Objectives", "10"],
        ["1.4 Identification of a Real-World Problem", "11"],
        ["1.5 Problem Justification", "11"],
        ["1.6 Scope Definition", "11"],
        ["1.7 List of Stakeholders", "12"],
        ["1.8 Feasibility Analysis (Technical, Economic, Operational, Legal & Ethical, Schedule)", "12"],
        ["CHAPTER 2: REQUIREMENT ENGINEERING", "14"],
        ["2.1 Functional Requirements (FR)", "14"],
        ["2.2 Non-Functional Requirements (NFR)", "15"],
        ["2.3 Use-Case Analysis & Actor Profiles", "15"],
        ["2.4 Requirement Prioritization (MoSCoW Matrix)", "15"],
        ["2.5 Constraints and Assumptions", "16"],
        ["2.6 Preliminary Product Description & Technology Stack Survey", "17"],
        ["2.7 Conceptual Models (Review of Existing Gym Management Systems)", "17"],
        ["CHAPTER 3: SOFTWARE DEVELOPMENT LIFE CYCLE (SDLC) PLANNING", "19"],
        ["3.1 Selection of SDLC Model (Agile-Style Iterative Approach)", "19"],
        ["3.2 Work Breakdown Structure (WBS)", "19"],
        ["3.3 Project Timeline & Scheduling (Gantt Chart & Sprint Roadmap)", "20"],
        ["3.4 Resource Planning (Hardware & Software Specifications)", "21"],
        ["CHAPTER 4: SYSTEM MODELING USING UML", "22"],
        ["4.1 Event Table", "22"],
        ["4.2 Class Diagram", "23"],
        ["4.3 Object Diagram", "24"],
        ["4.4 Use Case Diagram", "25"],
        ["4.5 Sequence Diagram", "26"],
        ["4.6 Activity Diagram", "27"],
        ["4.7 Component Diagram", "28"],
        ["4.8 Deployment Diagram", "29"],
        ["4.9 ER Diagram (Data Model)", "30"],
        ["CHAPTER 5: SYSTEM ARCHITECTURE DESIGN", "31"],
        ["Purpose and Scope", "31"],
        ["5.1 Frontend Architecture & Component Hierarchy", "31"],
        ["5.1 Screen Design — Rough UI Wireframes & User Interaction Flows", "32"],
        ["5.2 Backend Architecture (Express MVC Architecture)", "38"],
        ["5.3 Database Schema Design & Data Dictionary", "38"],
        ["5.3.11 Primary Key and Foreign Key Relationships", "44"],
        ["5.4 REST API Structure, Endpoints & JSON Contracts", "44"],
        ["5.6 Procedural Design (Core System Process Pseudocode)", "45"],
        ["CHAPTER 6: APPLICATION DEVELOPMENT", "46"],
        ["6.1 Frontend Implementation (HTML5, CSS3, JavaScript & Bootstrap)", "46"],
        ["6.2 Backend Implementation (Node.js & Express REST API)", "46"],
        ["6.3 Database Integration (MongoDB Atlas, Mongoose ORM)", "47"],
        ["6.4 Authentication & Validation", "47"],
        ["6.5 Error Handling & Exception Management", "48"],
        ["CHAPTER 7: INTEGRATION & SYSTEM TESTING", "49"],
        ["7.1 Testing Approach & Quality Assurance Framework", "49"],
        ["7.2 Unit Testing", "49"],
        ["7.3 Black-Box Testing", "50"],
        ["7.4 Integration Testing", "50"],
        ["7.5 Beta Testing & Usability Evaluation", "50"],
        ["7.6 Comprehensive Test Case Matrix (Unit, Integration & System Test Tables)", "50"],
        ["7.7 Bug Tracking & Defect Management", "76"],
        ["CHAPTER 8: DEPLOYMENT & HOSTING", "77"],
        ["8.1 Cloud Deployment & Local Hosting Architecture", "77"],
        ["8.2 Frontend Deployment & Dynamic Asset Serving", "78"],
        ["8.3 Server Configuration & Secure Environment Variables", "78"],
        ["8.4 Version Control using GitHub & Project Directory Tree", "79"],
        ["8.5 GitHub Repository Structure", "79"],
        ["8.6 Render Cloud Web Service Deployment", "80"],
        ["8.7 MongoDB Atlas Cloud Configuration & Timezone Synchronization", "80"],
        ["CHAPTER 9: PERFORMANCE & SECURITY TESTING", "82"],
        ["9.1 Basic Load Testing & Response Benchmarks", "82"],
        ["9.2 Input Validation Checks & Sanitization", "82"],
        ["9.3 Security Validation & Penetration Resistance", "83"],
        ["CHAPTER 10: RESULT AND DISCUSSION", "84"],
        ["10.1 Technical Report & Module Deliverables Summary", "84"],
        ["10.2 User Manual & Operational Walkthrough (Steps 1 to 7)", "84"],
        ["10.4 Source Code Documentation & Core Module Listings", "87"],
        ["10.4.8 Code-to-Module Mapping", "92"],
        ["10.4.9 Result Discussion", "92"],
        ["10.4.10 Limitations Identified from the Current Implementation", "93"],
        ["10.4.11 Overall Result", "93"],
        ["## SCREENSHOTS AND CODE ##", "94"],
        ["CONCLUSION", "106"]
    ]
    create_table(doc, ["Topic / Section Name", "Page No."], toc_rows, [5.2, 1.1])

    doc.add_page_break()

    # ==================== 4. ACKNOWLEDGEMENT ====================
    print("Generating Acknowledgement...")
    p_ack = doc.add_paragraph()
    p_ack.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_ack.add_run("ACKNOWLEDGEMENT\n")
    r.font.name = 'Arial'
    r.font.size = Pt(14)
    r.font.bold = True

    add_body_p(doc, "I wish to express my sincere gratitude to my project guide, Prof. Pranjali Chaudhari, for her invaluable guidance, patience, and encouragement throughout the course of this project. Her constructive feedback and technical insight were instrumental in shaping the design and direction of Uchala Dumbell Gym Management System.")
    add_body_p(doc, "I am also grateful to the Department of Computer Science, Modern Education Society’s The D. G. Ruparel College of Arts, Science & Commerce, for providing the laboratory access, computing resources, and academic environment necessary to complete this project.")
    add_body_p(doc, "I would like to thank the faculty members of the department for the knowledge gained through the coursework in software engineering, database management systems, full-stack web technologies, and software testing, which helped me approach this project with a sound understanding of quality, security, and responsive design.")
    add_body_p(doc, "Finally, I thank my family, friends, and classmates for their continuous support and motivation during the development and documentation of this project.")
    
    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.paragraph_format.space_before = Pt(30)
    r = p_sig.add_run("Sujal Manjrekar")
    r.font.name = 'Calibri'
    r.font.size = Pt(11)
    r.font.bold = True

    doc.add_page_break()

    # ==================== 5. ABSTRACT ====================
    print("Generating Abstract...")
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_abs.add_run("ABSTRACT\n")
    r.font.name = 'Arial'
    r.font.size = Pt(14)
    r.font.bold = True

    add_body_p(doc, "Managing a modern fitness centre or gymnasium is still a manual and fragmented process for many facility owners and personal trainers. Maintaining paper registers for member admissions, calculating monthly subscription dues, creating daily workout splits, delivering custom diet charts, and logging trainer attendance often involve repetitive manual entries, paper receipts, and uncoordinated communication across multiple channels.")
    add_body_p(doc, "This project presents the design and implementation of Uchala Dumbell Gym by Sujal, a cloud-native, full-stack Gym and Fitness Management System that connects Gym Owners, Dedicated Personal Trainers, and Registered Athletes / Members through a single platform with strict role-based access control. Gym Owners can register athletes with auto-generated sequential Gym IDs (UDGMEM-1001), hire trainers, configure dynamic membership plans with duration and pricing, directly assign membership plans and dedicated coaches, record fee payments, track pending balances with auto-generated invoices (INV-UDG-1001), issue itemized trainer salary vouchers (SAL-UDG-1001), and manage daily check-ins. Personal Trainers can manage their assigned trainee roster, design day-wise workout exercise splits, toggle live workout completion status, and assign personalized 4-meal nutritional diet plans (Vegetarian, Non-Vegetarian, Eggitarian, Vegan, Keto). Athletes / Members can view their active plan validity with real-time expiration countdowns, explore their daily exercise routines with an interactive weekly day selector (Monday to Sunday), review meal charts, and view invoice payment receipts.")
    add_body_p(doc, "The system uses a decoupled client-server architecture. The frontend is built using HTML5, CSS3, JavaScript (ES6), responsive dark/gold UI theming (`#0b0d13`, `#f39c12`), and a custom centered modal dialog engine (`custom-dialog.js`). The backend is an asynchronous REST API built using Node.js and Express.js, with Mongoose ORM and a MongoDB Atlas cloud database. Security is enforced through JSON Web Token (JWT) bearer authentication, password hashing with bcrypt, and role-based route middleware. The application is continuously deployed on Render connected with GitHub CI/CD.")
    add_body_p(doc, "The key outcome of this work is a robust, responsive, and easily extensible gym management platform that eliminates paper record-keeping, prevents revenue leakage through clear dues tracking, and streamlines athlete-coach interactions.")

    doc.add_page_break()

    # ==================== 6. DECLARATION ====================
    print("Generating Declaration...")
    p_dec = doc.add_paragraph()
    p_dec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_dec.add_run("DECLARATION\n")
    r.font.name = 'Arial'
    r.font.size = Pt(14)
    r.font.bold = True

    add_body_p(doc, "I, Sujal Manjrekar, student of the T.Y.B.Sc. (Computer Science – Sem V) class, hereby declare that the project entitled \"Uchala Dumbell Gym – Cloud Fitness & Gym Management System\" submitted in partial fulfillment for the award of the degree of Bachelor of Science in Computer Science during the academic year 2026–2027 is my original work.")
    add_body_p(doc, "The project has been carried out under the guidance of Prof. Pranjali Chaudhari and represents the work completed by me as part of the prescribed academic project requirements.")
    add_body_p(doc, "Furthermore, this project has not formed the basis for the award of any degree, associateship, fellowship, or any other similar titles.")
    add_body_p(doc, "I further declare that the problem identification, feasibility study, requirement engineering, software development life cycle planning, UML diagrams, database design, system architecture, application workflows, implementation details, testing records, and documentation included in this report have been prepared for the academic evaluation of the Uchala Dumbell Gym project.")
    add_body_p(doc, "Wherever external software technologies, frameworks, libraries, APIs, development tools, or technical documentation have been used, they have been acknowledged appropriately in the relevant sections and references of this report.")
    add_body_p(doc, "I understand that the submission is subject to the academic rules and regulations of D.G. Ruparel College of Arts, Science and Commerce, Mahim, and that the responsibility for the originality and accuracy of the submitted work rests with me.")

    doc.add_paragraph().paragraph_format.space_after = Pt(20)
    add_body_p(doc, "Name of the Student: Sujal Manjrekar\nClass: T.Y.B.Sc. (Computer Science – Sem V)\nSignature of the Student: ______________________________\nPlace: Mumbai, India\nDate: September 2026")

    doc.add_page_break()

    # ==================== 7. LIST OF ABBREVIATIONS ====================
    print("Generating List of Abbreviations...")
    p_abb = doc.add_paragraph()
    p_abb.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_abb.add_run("LIST OF ABBREVIATIONS\n")
    r.font.name = 'Arial'
    r.font.size = Pt(14)
    r.font.bold = True

    abb_rows = [
        ["API", "Application Programming Interface"],
        ["CRUD", "Create, Read, Update, Delete"],
        ["CSS", "Cascading Style Sheets"],
        ["DB", "Database"],
        ["DTO", "Data Transfer Object"],
        ["ER", "Entity-Relationship"],
        ["FK", "Foreign Key"],
        ["FR", "Functional Requirement"],
        ["HTML", "HyperText Markup Language"],
        ["HTTP", "Hypertext Transfer Protocol"],
        ["HTTPS", "Hypertext Transfer Protocol Secure"],
        ["JSON", "JavaScript Object Notation"],
        ["JS", "JavaScript"],
        ["JWT", "JSON Web Token"],
        ["MVC", "Model-View-Controller"],
        ["NFR", "Non-Functional Requirement"],
        ["ORM", "Object-Relational Mapping / Object-Document Mapping"],
        ["PK", "Primary Key"],
        ["REST", "Representational State Transfer"],
        ["SDLC", "Software Development Life Cycle"],
        ["SRS", "Software Requirements Specification"],
        ["UI", "User Interface"],
        ["UML", "Unified Modeling Language"],
        ["WBS", "Work Breakdown Structure"]
    ]
    create_table(doc, ["Abbreviation", "Full Form"], abb_rows, [1.8, 4.5])

    doc.add_page_break()

    # ==================== CHAPTER 1 ====================
    print("Generating Chapter 1...")
    add_heading_1(doc, "CHAPTER 1: PROBLEM IDENTIFICATION & FEASIBILITY STUDY")
    
    add_heading_2(doc, "1.1 Role and Responsibility :")
    role_rows = [
        ["Authentication Module", "Handles user login, role-based authorization (owner, trainer, member), and secure password hashing using bcrypt."],
        ["Member Management Module", "Handles athlete registration with auto-generated sequential Gym IDs (UDGMEM-1001), profile editing, and trainer allocation."],
        ["Trainer Management Module", "Manages coach hiring, monthly salary configuration, specialization profiles, and assigned trainee rosters."],
        ["Membership Plan Module", "Allows creating, editing, and deleting multi-tier gym membership plans with duration and pricing."],
        ["Plan Assignment Module", "Enables direct and registration-time plan activation with automated start date and expiration date calculation."],
        ["Billing & Invoicing Module", "Tracks member payments, computes outstanding dues, issues invoice numbers (INV-UDG-1001), and collects remaining balances."],
        ["Salary & Payroll Module", "Computes base salary, bonuses, deductions, and net payouts, generating sequential vouchers (SAL-UDG-1001)."],
        ["Workout Management Module", "Allows personal trainers to build customized day-wise exercise splits with live completion toggle (Mark Done / Pending)."],
        ["Diet Management Module", "Enables trainers to prescribe structured 4-meal nutritional diet sheets across Vegetarian, Non-Veg, Eggitarian, and Keto types."],
        ["Attendance Tracking Module", "Records daily check-ins and time logs for athletes and coaches with status editing and date filtering."]
    ]
    create_table(doc, ["Module", "Main Function"], role_rows, [2.2, 4.1])

    add_heading_2(doc, "1.2 Background and Motivation:")
    add_body_p(doc, "Uchala Dumbell Gym by Sujal is a web-based fitness and gym management platform designed to make gym administration effortless, accurate, and transparent. Traditional gyms struggle with manual record-keeping on paper notebooks, uncoordinated workout routines written on random scraps of paper, uncollected subscription fees, and lack of real-time attendance visibility. The project combines a modern HTML5/CSS3/JavaScript frontend with an Express/Node.js REST API backend and MongoDB Atlas cloud database. It eliminates operational overhead by providing synchronized portals for gym owners, trainers, and athletes.")

    add_heading_2(doc, "1.3 Objectives:")
    add_bullet_p(doc, "Provide secure login and dashboard routing for Owner, Trainers, and Members with JWT authorization.")
    add_bullet_p(doc, "Automate sequential gym identity numbering (UDGMEM-1001, UDGTRN-1001, INV-UDG-1001, SAL-UDG-1001).")
    add_bullet_p(doc, "Support dynamic membership package creation and instant plan assignment with validity date tracking.")
    add_bullet_p(doc, "Enable automated billing invoices, partial fee recording, and one-click remaining due collection.")
    add_bullet_p(doc, "Provide trainer salary payroll calculation with itemized bonus and deduction slips.")
    add_bullet_p(doc, "Allow coaches to design daily workout splits and toggle completion status in real-time.")
    add_bullet_p(doc, "Deliver structured 4-meal diet cards to athletes without clutter or redundant numbers.")
    add_bullet_p(doc, "Provide an interactive weekly workout day selector (Monday to Sunday) on the athlete dashboard.")

    add_heading_2(doc, "1.4 Identification of a Real-World Problem:")
    add_body_p(doc, "Many fitness facilities still face acute administrative inefficiencies due to manual ledger management. Gym owners find it challenging to track when individual memberships expire, leading to uncollected revenue and unauthorized gym access. Personal trainers struggle to communicate updated workout routines and meal plans to multiple clients. Members lack a single digital place to view their workout progress, dietary instructions, attendance records, and payment receipts. A centralized, cloud-hosted management system is essential to solve these operational bottlenecks.")

    add_heading_2(doc, "1.5 Problem Justification")
    add_bullet_p(doc, "Manual paper ledgers frequently cause subscription expiration oversights and uncollected fee dues.")
    add_bullet_p(doc, "Athletes need continuous mobile access to their coach-assigned workout splits and nutritional meal plans.")
    add_bullet_p(doc, "Trainers need an easy tool to mark workout completion and track assigned trainees' daily check-ins.")
    add_bullet_p(doc, "Gym owners require instant desk visibility into total active members, revenue, outstanding dues, and trainer payroll.")

    add_heading_2(doc, "1.6 Scope Definition")
    add_bullet_p(doc, "Owner command desk: Member registration, trainer hiring, plan creation, plan assignment, billing, dues collection, salaries, workouts overview, and diets overview.")
    add_bullet_p(doc, "Trainer workspace: Trainee roster, day-wise exercise routine builder, live completion status toggle, and custom diet chart creator.")
    add_bullet_p(doc, "Member portal: Active membership status with validity countdown, interactive weekly workout day selector, 4-meal diet cards, and billing invoice history.")
    add_bullet_p(doc, "REST API backend with JWT token authorization, Mongoose schema validation, and MongoDB Atlas cloud database.")

    add_heading_2(doc, "1.7 List of Stakeholders:")
    add_bullet_p(doc, "Gym Owner (Sujal) - Central administrator overseeing operations, finance, memberships, and staff.")
    add_bullet_p(doc, "Personal Trainers - Fitness coaches managing assigned athletes, routines, diet sheets, and attendance.")
    add_bullet_p(doc, "Gym Members / Athletes - Registered members accessing workouts, meal guidance, validity, and invoices.")

    add_heading_2(doc, "1.8 Feasibility Analysis")
    add_body_p(doc, "A comprehensive feasibility study was conducted using the standard TELOS framework:")
    add_bullet_p(doc, "Technical Feasibility: Built on Node.js, Express, MongoDB Atlas, and modern JavaScript. All technologies are fast, scalable, and cross-platform.")
    add_bullet_p(doc, "Economic Feasibility: Developed using 100% open-source tools with zero licensing cost. Deployed on Render cloud hosting.")
    add_bullet_p(doc, "Operational Feasibility: The responsive dark/gold interface (`#0b0d13`, `#f39c12`) with centered modal dialogs makes navigation intuitive.")
    add_bullet_p(doc, "Legal & Ethical Feasibility: Enforces secure bcrypt password encryption, JWT bearer authorization, and role guards to protect user data.")
    add_bullet_p(doc, "Schedule Feasibility: Structured across 5 iterative Agile sprints over a 12-week development roadmap.")

    doc.add_page_break()

    # ==================== CHAPTER 2 ====================
    print("Generating Chapter 2...")
    add_heading_1(doc, "CHAPTER 2: REQUIREMENT ENGINEERING")
    add_body_p(doc, "SRS - FUNCTIONAL AND NON-FUNCTIONAL REQUIREMENTS")

    add_heading_2(doc, "2.1 Functional Requirements")
    fr_rows = [
        ["FR-01", "The system shall allow users (Owner, Trainer, Member) to securely authenticate using their email/Gym ID and password.", "High"],
        ["FR-02", "The system shall automatically generate sequential Gym IDs (UDGMEM-1001, UDGTRN-1001) upon user registration.", "High"],
        ["FR-03", "The system shall allow the Owner to create, view, update, and delete membership plans with duration and price.", "High"],
        ["FR-04", "The system shall provide a dedicated 'Assign Membership Plan' section to enroll members directly into plans.", "High"],
        ["FR-05", "The system shall automatically link selected membership plans and generate initial invoices upon member creation.", "High"],
        ["FR-06", "The system shall record customer fee payments and generate auto-incremented invoice numbers (INV-UDG-1001).", "High"],
        ["FR-07", "The system shall calculate outstanding dues and allow one-click remaining balance collection via 'Pay Due'.", "High"],
        ["FR-08", "The system shall allow editing payment records (total, paid, due, mode, notes) with instant stats refresh.", "High"],
        ["FR-09", "The system shall compute trainer net salaries (Base + Bonuses - Deductions) and issue salary vouchers (SAL-UDG-1001).", "High"],
        ["FR-10", "The system shall allow coaches to build customized day-wise workout splits (sets, reps, target weight, notes).", "High"],
        ["FR-11", "The system shall allow coaches to toggle workout routine completion status ('Mark Done' / 'Mark Pending').", "High"],
        ["FR-12", "The system shall allow coaches to prescribe 4-meal diet charts supporting Vegetarian, Non-Veg, Eggitarian, and Keto.", "High"],
        ["FR-13", "The system shall display the athlete's active plan name, perks, price, expiry date, and days remaining countdown.", "High"],
        ["FR-14", "The system shall provide an interactive weekly day selector (Monday-Sunday) on the member workout dashboard.", "High"],
        ["FR-15", "The system shall log daily attendance for members and trainers with date filtering and status editing.", "High"],
        ["FR-16", "The system shall allow the Owner to reset user passwords and allow users to change their own password.", "High"],
        ["FR-17", "The system shall provide centered dark & gold modal dialog popups (customAlert, customConfirm) for all actions.", "Medium"]
    ]
    create_table(doc, ["ID", "Requirement", "Priority"], fr_rows, [0.9, 4.5, 0.9])

    add_heading_2(doc, "2.2 Non-Functional Requirements")
    nfr_rows = [
        ["NFR-01", "Performance: REST API endpoints shall respond within 150ms under standard operational conditions.", "High"],
        ["NFR-02", "Usability: The system shall provide a responsive dark & gold themed interface with clear validation and feedback.", "High"],
        ["NFR-03", "Security: Passwords shall be encrypted with 10-round bcrypt hashing, and API access protected with JWT tokens.", "High"],
        ["NFR-04", "Data Integrity: The system shall enforce referential integrity between Users, Plans, Payments, Salaries, and Routines.", "High"],
        ["NFR-05", "Maintainability: The backend shall follow a modular MVC architecture separating routes, controllers, and schemas.", "Medium"],
        ["NFR-06", "Compatibility: The frontend shall function seamlessly on all modern web browsers (Chrome, Edge, Safari, Firefox).", "Medium"],
        ["NFR-07", "Availability: The system shall achieve 99.9% uptime hosted on Render cloud infrastructure with MongoDB Atlas.", "High"],
        ["NFR-08", "Timezone Synchronization: Workout schedules shall match the user's local timezone (IST) regardless of server UTC time.", "High"],
        ["NFR-09", "Resilience: The system shall handle missing or failed network requests gracefully without breaking the UI.", "Medium"]
    ]
    create_table(doc, ["ID", "Requirement", "Priority"], nfr_rows, [0.9, 4.5, 0.9])

    add_heading_2(doc, "2.3 Use-Case Analysis & Actor Profiles")
    actor_rows = [
        ["Owner (Admin)", "Login; Manage Members; Manage Trainers; Create/Edit Plans; Assign Plan; Assign Trainer; Record Payments; Pay Due; Issue Salary; Mark Attendance; Reset Passwords; View Workouts/Diets."],
        ["Personal Trainer", "Login; View Assigned Trainees; Log Daily Workout Splits; Toggle Workout Done/Pending; Prescribe 4-Meal Diets; Mark Trainee Attendance; View Own Salary Vouchers."],
        ["Gym Member", "Login; View Active Plan & Expiry Countdown; View Daily Workouts with Weekly Day Selector; View 4-Meal Diet Cards; View Payment Invoices; View Check-in History; Change Password."]
    ]
    create_table(doc, ["Actor", "Main Use Cases"], actor_rows, [1.8, 4.5])

    add_heading_2(doc, "2.4 Requirement Prioritization (MoSCoW Matrix)")
    mos_rows = [
        ["Must Have", "User authentication; Role-based dashboards; Member & Trainer CRUD; Plan assignment; Invoicing; Salary vouchers; Workouts & Diets; Attendance tracking."],
        ["Should Have", "Live workout completion toggle; Interactive weekly day selector tabs; Custom dark/gold modal dialogs; Partial dues collection; Timezone sync."],
        ["Could Have", "Printable invoice slip downloads; Attendance export to CSV; Dynamic membership package cards on landing page."],
        ["Won't Have (Current Scope)", "Biometric IoT hardware integration; SMS gateway automated alerts; Native Android/iOS APK builds (identified for future enhancement)."]
    ]
    create_table(doc, ["Priority", "Uchala Gym Requirements Scope"], mos_rows, [1.8, 4.5])

    add_heading_2(doc, "2.5 Constraints and Assumptions")
    add_body_p(doc, "Constraints:\n• The system depends on Node.js/Express REST backend and MongoDB Atlas cloud database.\n• The frontend is a lightweight browser application using Vanilla HTML5, CSS3, and JavaScript.\n• Cloud deployment operates on Render with environment variables for database URI and JWT secret.\n\nAssumptions:\n• Users access the application via a modern web browser with active internet connection.\n• Members and trainers provide valid contact information upon registration.\n• The gym operates daily scheduling according to standard days of the week (Monday through Sunday).")

    add_heading_2(doc, "2.6 Preliminary Product Description & Technology Stack Survey")
    tech_rows = [
        ["Frontend", "HTML5, CSS3, JavaScript (ES6), Custom Dialog Engine", "Responsive user interface, role dashboards, dynamic DOM tables, and dark/gold theming."],
        ["Backend", "Node.js 20, Express.js 4.x", "RESTful API services, JWT token authorization, controller routing, and business logic."],
        ["Persistence", "Mongoose ORM 8.x", "Object-Document mapping, schema validation, population, and query building."],
        ["Database", "MongoDB Atlas (Cloud Cluster)", "Document storage of users, plans, payments, salaries, workouts, diets, and attendance."],
        ["Hosting & CI/CD", "Render.com, GitHub Webhooks", "Automated container builds, cloud web service hosting, and continuous deployment."]
    ]
    create_table(doc, ["Layer / Area", "Technology / Component", "Purpose"], tech_rows, [1.5, 2.3, 2.5])

    doc.add_page_break()

    # ==================== CHAPTER 3 ====================
    print("Generating Chapter 3...")
    add_heading_1(doc, "CHAPTER 3: SOFTWARE DEVELOPMENT LIFE CYCLE (SDLC) PLANNING")
    
    add_heading_2(doc, "3.1 Selection of SDLC Model (Agile-Style Iterative Approach) :")
    add_body_p(doc, "Uchala Dumbell Gym was engineered using the Agile Iterative Development Model. The project was organized into functional modules and executed in sequential sprint iterations. Each iteration delivered a testable milestone (e.g., Auth & Core Models $\\rightarrow$ Owner Desk $\\rightarrow$ Trainer Module $\\rightarrow$ Member Module $\\rightarrow$ Testing & Deployment), allowing rapid adjustments based on usability feedback.")

    add_heading_2(doc, "3.2 Work Breakdown Structure (WBS) :")
    wbs_table_rows = [
        ["Iteration 1", "Requirement Analysis & System Architecture", "Requirement specification, Mongoose schema modeling, JWT auth planning, and UML diagrams.", "Approved SRS & Architecture Blueprint"],
        ["Iteration 2", "Core Backend API & Database Integration", "User models, Owner CRUD controllers, Sequential ID generators, and MongoDB Atlas setup.", "Working Auth & Owner REST API Foundation"],
        ["Iteration 3", "Frontend Dashboards & Plan Assignment", "Owner, Trainer, and Member dashboard views, Assign Plan direct form, and billing invoices.", "Functional Multi-Role Portals & Invoicing"],
        ["Iteration 4", "Workouts, Diets & Attendance Engine", "Day-wise workout split builder, live completion toggle, 4-meal diet creator, and check-in logs.", "Working Workout, Diet & Attendance System"],
        ["Iteration 5", "Testing, Hardening, Polish & Deployment", "Timezone synchronization, custom modal dialog engine, Render cloud hosting, and Black Book.", "Live Production Web App & Documentation"]
    ]
    create_table(doc, ["WBS ID", "Iteration / Phase", "Core Engineering Tasks & Deliverables", "Milestone Output"], wbs_table_rows, [1.0, 1.6, 2.5, 1.2])

    add_heading_2(doc, "3.3 Project Timeline & Scheduling (Gantt Chart & Sprint Roadmap) :")
    add_body_p(doc, "The 12-week development roadmap followed the five Agile sprint phases:")
    add_bullet_p(doc, "Phase 1 (Weeks 1-2): Problem identification, stakeholder analysis, SRS preparation, and architecture blueprint.")
    add_bullet_p(doc, "Phase 2 (Weeks 3-4): Mongoose data schemas, Express controller architecture, JWT token middleware, and MongoDB Atlas clustering.")
    add_bullet_p(doc, "Phase 3 (Weeks 5-6): Frontend portal implementation, responsive dark/gold layout, plan assignment, and billing engine.")
    add_bullet_p(doc, "Phase 4 (Weeks 7-8): Trainer routine builder, live status toggling, 4-meal diet cards, and athlete attendance tracking.")
    add_bullet_p(doc, "Phase 5 (Weeks 9-10): Integration testing, timezone offset synchronization, custom dialog engine, and bug hardening.")
    add_bullet_p(doc, "Phase 6 (Weeks 11-12): Cloud deployment on Render, GitHub CI/CD pipeline, and final Black Book report generation.")

    add_heading_2(doc, "3.4 Resource Planning (Hardware & Software Specifications):")
    add_body_p(doc, "1. Hardware Requirements:\n• Processor: Intel Core i3 / i5 / AMD Ryzen or equivalent.\n• RAM: 4 GB minimum (8 GB recommended).\n• Storage: At least 2 GB free disk space for Node environment and repository.\n• Internet Connection: Active broadband for cloud deployment and MongoDB Atlas sync.\n\n2. Software Requirements:\n• Operating System: Windows 10/11, macOS, or Linux.\n• Runtime: Node.js (v18.x or v20.x LTS) & npm.\n• Database: MongoDB Atlas cloud cluster / MongoDB Community Server.\n• Editor: Visual Studio Code.\n• Web Browser: Google Chrome, Microsoft Edge, or Mozilla Firefox.\n• Version Control: Git & GitHub.")

    doc.add_page_break()

    # ==================== CHAPTER 4 ====================
    print("Generating Chapter 4...")
    add_heading_1(doc, "CHAPTER 4: SYSTEM MODELING USING UML")
    
    add_heading_2(doc, "4.1 Event Table")
    add_body_p(doc, "The event table lists core events occurring within the Uchala Gym ecosystem:")
    ev_rows = [
        ["User logs in", "User submits email and password", "User", "Authenticate User", "JWT token returned, redirect to dashboard", "Client Portal"],
        ["Owner creates member", "Owner submits member form", "Owner", "Register Member", "Member saved with Gym ID & initial invoice", "Owner Table"],
        ["Owner assigns plan", "Owner submits assign plan form", "Owner", "Assign Plan", "Member plan updated with validity dates", "Owner / Member UI"],
        ["Owner collects due fee", "Owner clicks 'Pay Due' and submits", "Owner", "Collect Due", "Due becomes ₹0, status updated to Paid", "Payment Table"],
        ["Owner issues salary", "Owner submits salary voucher form", "Owner", "Issue Salary", "SAL-UDG-XXXX voucher generated", "Salary Table"],
        ["Trainer logs workout", "Trainer submits exercise split", "Trainer", "Create Workout", "Exercises saved for athlete on selected day", "Trainer / Member UI"],
        ["Trainer toggles workout", "Trainer clicks 'Mark Done'", "Trainer", "Toggle Completion", "isCompleted toggled, badge updated", "Trainer / Member UI"],
        ["Trainer assigns diet", "Trainer submits 4-meal plan", "Trainer", "Create Diet", "Diet sheet saved with selected dietType", "Trainer / Member UI"],
        ["Member checks workout", "Member clicks day button (e.g. Mon)", "Member", "Get Daily Workout", "Routines and exercises loaded for that day", "Member Table"],
        ["Mark attendance", "User check-in marked", "Owner/Trainer", "Log Attendance", "Attendance record logged with date/time", "Attendance Table"]
    ]
    create_table(doc, ["Event", "Trigger", "Source", "Use Case", "Response", "Destination"], ev_rows, [1.0, 1.2, 0.7, 1.1, 1.3, 1.0])

    add_heading_2(doc, "4.2 Class Diagram")
    add_body_p(doc, "The Class Diagram models the Mongoose schema architecture:\n• User: Stores authentication credentials, gymId, role ('owner'|'trainer'|'member'), assignedTrainer (ref User), currentPlan (ref MembershipPlan), planStartDate, planEndDate.\n• MembershipPlan: Stores planName, durationInMonths, price, description, features [String], isActive.\n• Workout: Stores member (ref User), trainer (ref User), workoutTitle, day ('Monday'-'Sunday'), exercises [{name, sets, reps, weight}], isCompleted, notes.\n• Diet: Stores member (ref User), trainer (ref User), dietType ('Vegetarian'|'Non-Vegetarian'|'Eggitarian'|'Vegan'|'Keto'|'Custom'), dailyGoal, meals [{mealTime, items}], notes.\n• Payment: Stores invoiceNumber, member (ref User), membershipPlan (ref MembershipPlan), totalAmount, paidAmount, dueAmount, paymentMode, status ('Paid'|'Partial'|'Pending'), paymentDate.\n• Salary: Stores receiptNumber, trainer (ref User), month, baseSalary, bonuses, deductions, netSalary, status, paymentDate.\n• Attendance: Stores user (ref User), userRole, date, status ('Present'|'Absent'), inTime, markedBy.")

    add_heading_2(doc, "4.5 Sequence Diagram")
    add_body_p(doc, "1. Member Plan Assignment Flow: Owner Portal submits `POST /api/owner/assign-plan` $\\rightarrow$ `ownerController.assignPlanToMember` verifies member and plan $\\rightarrow$ calculates `planStartDate` (today) and `planEndDate` (+duration months) $\\rightarrow$ saves User document $\\rightarrow$ returns confirmation $\\rightarrow$ Frontend displays `customAlert()`.\n2. Daily Workout Loading Flow: Member Portal requests `GET /api/member/today-workout?day=Monday` $\\rightarrow$ `memberController.getTodayWorkout` queries `Workout.find({ member, day })` $\\rightarrow$ returns all routines for Monday $\\rightarrow$ Member table renders all exercise rows with completion status.")

    add_heading_2(doc, "4.8 Deployment Diagram")
    add_body_p(doc, "The physical architecture consists of three nodes:\n• Client Tier: Web Browser (Chrome/Edge/Safari) executing HTML5/CSS3/JavaScript.\n• Application Server Tier: Node.js 20 & Express.js REST API hosted on Render Cloud (HTTPS).\n• Database Server Tier: MongoDB Atlas cloud replica cluster connected over encrypted TLS connection URI.")

    doc.add_page_break()

    # ==================== CHAPTER 5 ====================
    print("Generating Chapter 5...")
    add_heading_1(doc, "CHAPTER 5: SYSTEM ARCHITECTURE DESIGN")
    
    add_heading_2(doc, "5.1 Frontend Architecture & Component Hierarchy")
    add_body_p(doc, "Uchala Gym features role-segregated dashboard views structured around shared design tokens:")
    sc_rows = [
        ["index.html", "Public Landing Page", "Gym branding, hero showcase, dynamic membership plans loaded from MongoDB, and contact details."],
        ["login.html", "Unified Authentication Portal", "Email/Gym ID and password login with automatic role detection and redirect."],
        ["owner-dashboard.html", "Owner Command Desk", "Real-time statistics cards, Member management, Trainer hiring, Plan management, Assign Plan, Assign Trainer, Attendance, Payments, Salaries, Workouts overview, and Diets overview."],
        ["trainer-dashboard.html", "Trainer Workspace", "Trainee roster, day-wise exercise split builder, live completion toggle, 4-meal diet builder, trainee attendance, and salary slips."],
        ["member-dashboard.html", "Athlete Dashboard", "Active membership card with validity countdown, today's workout split with weekly day selector (Mon-Sun), 4-meal diet cards, check-in history, and payment invoice receipts."]
    ]
    create_table(doc, ["Screen / File", "Module / Role", "Purpose"], sc_rows, [1.5, 1.8, 3.0])

    add_heading_2(doc, "5.2 Backend Architecture (Express MVC)")
    add_body_p(doc, "1. Controller Layer: Receives incoming HTTP requests, validates input parameters, delegates tasks, and formats JSON responses (authController, ownerController, trainerController, memberController).\n2. Middleware Layer: `authMiddleware.js` extracts Bearer JWT token from headers, verifies token signature, attaches authenticated user to `req.user`, and verifies role permissions (`authorize('owner')`).\n3. Data Layer: Mongoose models enforce validation, schema constraints, and execute queries against MongoDB Atlas.")

    add_heading_2(doc, "5.3 Database Schema Design & Data Dictionary")
    add_heading_3(doc, "5.3.1 Users Collection")
    u_fields = [
        ["_id", "ObjectId", "PK", "Unique MongoDB identifier."],
        ["gymId", "String", "UNIQUE", "Sequential identifier (e.g. UDGMEM-1001, UDGTRN-1001)."],
        ["name", "String", "-", "Full name of the user."],
        ["email", "String", "UNIQUE", "Email address used for authentication."],
        ["password", "String", "-", "Bcrypt hashed password string."],
        ["phone", "String", "-", "Contact telephone number."],
        ["role", "String", "-", "Account role: 'owner', 'trainer', or 'member'."],
        ["assignedTrainer", "ObjectId", "FK → Users._id", "Dedicated personal trainer assigned to member."],
        ["currentPlan", "ObjectId", "FK → Plans._id", "Active membership package assigned to member."],
        ["planStartDate", "Date", "-", "Date when membership plan became active."],
        ["planEndDate", "Date", "-", "Expiration date of the membership package."],
        ["monthlySalary", "Number", "-", "Monthly base salary for trainers."]
    ]
    create_table(doc, ["Field", "Data Type", "Key", "Description"], u_fields, [1.2, 1.2, 1.1, 2.8])

    add_heading_3(doc, "5.3.2 Payments Collection")
    p_fields = [
        ["_id", "ObjectId", "PK", "Unique payment transaction identifier."],
        ["invoiceNumber", "String", "UNIQUE", "Sequential invoice number (e.g. INV-UDG-1001)."],
        ["member", "ObjectId", "FK → Users._id", "Member who made the payment."],
        ["membershipPlan", "ObjectId", "FK → Plans._id", "Membership package associated with invoice."],
        ["totalAmount", "Number", "-", "Total package fee cost."],
        ["paidAmount", "Number", "-", "Amount paid by member."],
        ["dueAmount", "Number", "-", "Outstanding balance due."],
        ["status", "String", "-", "Payment status: 'Paid', 'Partial', or 'Pending'."],
        ["paymentMode", "String", "-", "Payment mode: 'Cash', 'UPI', 'Card', etc."],
        ["paymentDate", "Date", "-", "Date when transaction was recorded."]
    ]
    create_table(doc, ["Field", "Data Type", "Key", "Description"], p_fields, [1.2, 1.2, 1.1, 2.8])

    add_heading_2(doc, "5.4 REST API Structure, Endpoints & JSON Contracts")
    api_tab_rows = [
        ["Auth", "POST", "/api/auth/login", "Public", "Authenticates user and returns JWT token and role."],
        ["Auth", "GET", "/api/auth/plans", "Public", "Returns active membership plans for landing page."],
        ["Owner", "GET", "/api/owner/stats", "Owner", "Returns totals for active members, trainers, revenue, and dues."],
        ["Owner", "POST", "/api/owner/members", "Owner", "Registers new member, links plan/trainer, and creates invoice."],
        ["Owner", "POST", "/api/owner/assign-plan", "Owner", "Directly assigns membership plan and computes validity."],
        ["Owner", "PUT", "/api/owner/payments/:id/pay-due", "Owner", "Collects remaining due fee and marks invoice as Paid."],
        ["Owner", "POST", "/api/owner/salaries", "Owner", "Calculates net salary and issues SAL-UDG-XXXX voucher."],
        ["Trainer", "GET", "/api/trainer/trainees", "Trainer", "Retrieves all athletes assigned to the coach."],
        ["Trainer", "POST", "/api/trainer/workouts", "Trainer", "Logs customized exercise split for an athlete."],
        ["Trainer", "PUT", "/api/trainer/workouts/:id/complete", "Trainer", "Toggles workout completion status (Done/Pending)."],
        ["Trainer", "POST", "/api/trainer/diets", "Trainer", "Prescribes 4-meal diet chart (Veg, Non-Veg, Egg, Keto)."],
        ["Member", "GET", "/api/member/today-workout", "Member", "Retrieves workouts for requested day (?day=Monday)."],
        ["Member", "GET", "/api/member/my-plan", "Member", "Returns active plan details, validity countdown, and invoices."]
    ]
    create_table(doc, ["Module", "Method", "Endpoint", "Role", "Purpose"], api_tab_rows, [0.8, 0.7, 2.3, 0.8, 1.7])

    doc.add_page_break()

    # ==================== CHAPTER 6 ====================
    print("Generating Chapter 6...")
    add_heading_1(doc, "CHAPTER 6: APPLICATION DEVELOPMENT")
    
    add_heading_2(doc, "6.1 Frontend Implementation (HTML5, CSS3, JavaScript & Custom Dialog Engine)")
    add_body_p(doc, "The frontend is engineered as a responsive Single Page Interface. The codebase avoids heavy external frameworks in favor of clean, performant Vanilla JavaScript (ES6) with async/await Fetch API requests. Custom modal dialogs (`custom-dialog.js`) provide consistent dark/gold confirmation and alert popups (`customAlert`, `customConfirm`), eliminating default browser dialogues.")

    add_heading_2(doc, "6.2 Backend Implementation (Node.js & Express REST API)")
    add_body_p(doc, "The backend is implemented with Express.js micro-framework running on Node.js. Business logic is organized into specialized controller modules. Sequential ID generators (`generateNextGymId`) automatically compute next available numbers from database counts.")

    add_heading_2(doc, "6.3 Database Integration (MongoDB Atlas, Mongoose ORM)")
    add_body_p(doc, "Mongoose schemas enforce strict type validation, default values, and relational references via `ObjectId`. Queries utilize `.populate('assignedTrainer')` and `.populate('currentPlan')` to resolve nested document links efficiently.")

    add_heading_2(doc, "6.4 Authentication & Validation")
    add_body_p(doc, "User passwords are encrypted using bcrypt before database insertion. On successful login, the server issues a signed JWT token containing the user's `_id` and `role`. Protected API routes verify the Bearer token in the `Authorization` header.")

    add_heading_2(doc, "6.5 Error Handling & Exception Management")
    add_body_p(doc, "Controllers wrap asynchronous operations in `try-catch` blocks and return standardized JSON error responses `{ success: false, message: '...' }`. The frontend displays these messages cleanly inside centered error dialogs.")

    doc.add_page_break()

    # ==================== CHAPTER 7 ====================
    print("Generating Chapter 7...")
    add_heading_1(doc, "CHAPTER 7: INTEGRATION & SYSTEM TESTING")
    
    add_heading_2(doc, "7.1 Testing Approach & Quality Assurance Framework")
    add_body_p(doc, "A comprehensive quality assurance approach was executed across all three application layers (Presentation, Business Logic, and Database Persistence). A total of 30 structured test cases were executed across Unit, Integration, and System testing.")

    add_heading_2(doc, "7.6 Comprehensive Test Case Matrix")
    add_body_p(doc, "Table 7.1: Comprehensive Test Cases Execution Log")
    tc_full_rows = [
        ["TC-01", "Auth", "Login with valid Owner credentials", "Enter valid email and password", "Valid credentials", "Redirect to Owner Dashboard", "Pass"],
        ["TC-02", "Auth", "Reject login with invalid password", "Enter correct email, wrong password", "Wrong password", "HTTP 401: Invalid credentials", "Pass"],
        ["TC-03", "Auth", "Reject login with unregistered email", "Enter non-existent email", "unknown@test.com", "HTTP 401: User not found", "Pass"],
        ["TC-04", "Owner", "Register member with plan & trainer", "Fill all registration fields", "Valid member data", "Member created with Gym ID & plan", "Pass"],
        ["TC-05", "Owner", "Reject duplicate member email", "Enter already registered email", "Duplicate email", "HTTP 400: Email already exists", "Pass"],
        ["TC-06", "Owner", "Direct plan assignment to member", "Select member, plan, start date", "Member ID, Plan ID", "Plan active & end date computed", "Pass"],
        ["TC-07", "Owner", "Record payment with partial due", "Input ₹3000 total, ₹2000 paid", "Paid: ₹2000", "INV-UDG-XXXX created with ₹1000 due", "Pass"],
        ["TC-08", "Owner", "Collect remaining due fee", "Click 'Pay Due' and submit", "Payment ID, ₹1000", "Due becomes ₹0, status: Paid", "Pass"],
        ["TC-09", "Owner", "Edit payment record notes & amounts", "Modify amounts & notes in modal", "Updated notes", "Payment updated & stats refreshed", "Pass"],
        ["TC-10", "Owner", "Hire trainer with monthly salary", "Submit trainer hire form", "Salary: ₹30000", "Trainer saved with UDGTRN-XXXX", "Pass"],
        ["TC-11", "Owner", "Generate trainer salary voucher", "Base: ₹30000, Bonus: ₹2000", "Bonus: ₹2000", "SAL-UDG-XXXX net ₹32000 issued", "Pass"],
        ["TC-12", "Owner", "Mark member & trainer attendance", "Select person, status: Present", "Present", "Attendance record logged with date", "Pass"],
        ["TC-13", "Owner", "Reset user password", "Select user, input new pass", "newpass123", "Password updated & hashed", "Pass"],
        ["TC-14", "Trainer", "View assigned trainee roster", "Open trainer trainees tab", "Trainer token", "Lists only assigned athletes", "Pass"],
        ["TC-15", "Trainer", "Log daily workout split", "Add 3 exercises with sets/reps", "Exercises list", "Workout saved under athlete & day", "Pass"],
        ["TC-16", "Trainer", "Toggle workout completion status", "Click 'Mark Done' on routine", "Workout ID", "isCompleted toggles to true", "Pass"],
        ["TC-17", "Trainer", "Assign Eggitarian diet plan", "Select Eggitarian, input 4 meals", "Eggitarian", "Diet saved without enum error", "Pass"],
        ["TC-18", "Trainer", "Delete workout routine", "Click Delete and confirm dialog", "Workout ID", "Workout routine deleted from DB", "Pass"],
        ["TC-19", "Member", "Display active plan & countdown", "Open member dashboard", "Member token", "Shows plan name, price, expiry days", "Pass"],
        ["TC-20", "Member", "Weekly workout day selector", "Click 'Monday' pill button", "Click Monday", "Monday routines & exercises loaded", "Pass"],
        ["TC-21", "Member", "View multi-routine exercises", "Two workouts assigned for Mon", "Monday", "Both routine sections displayed", "Pass"],
        ["TC-22", "Member", "View 4-meal personalized diet", "Open diet plan section", "Member token", "Breakfast, Lunch, Pre, Dinner shown", "Pass"],
        ["TC-23", "Member", "View past payment invoices", "Open membership section", "Member token", "Lists invoices with paid & due amounts", "Pass"],
        ["TC-24", "Security", "Access control route protection", "Member token calling /api/owner", "Member JWT", "HTTP 403: Role forbidden", "Pass"],
        ["TC-25", "Security", "Token tampering prevention", "Modified JWT signature", "Invalid JWT", "HTTP 401: Token invalid", "Pass"],
        ["TC-26", "UI", "Timezone synchronization", "Request workout from IST time", "IST 01:44 AM", "Matches local Monday correctly", "Pass"],
        ["TC-27", "UI", "Custom confirmation dialog cancel", "Click 'Cancel' on delete dialog", "Cancel action", "Data remains completely unchanged", "Pass"],
        ["TC-28", "UI", "Responsive rendering on mobile", "Viewport set to 375px width", "Mobile width", "Sidebar & tables remain fully usable", "Pass"]
    ]
    create_table(doc, ["TC ID", "Module", "Test Scenario", "Test Steps", "Test Data", "Expected Output", "Status"], tc_full_rows, [0.7, 0.7, 1.4, 1.1, 1.0, 1.1, 0.5])

    add_heading_2(doc, "7.7 Bug Tracking & Defect Management")
    add_body_p(doc, "Table 7.4: Bug Tracking & Defect Management Log")
    bug_table_rows = [
        ["BUG-01", "Member UI", "Timezone mismatch on member workout (showing Sunday instead of Monday)", "Passed client local day in query parameter (?day=Monday)", "Resolved & Verified"],
        ["BUG-02", "Backend", "Mongoose validation error for 'Eggitarian' dietType", "Added 'Eggitarian', 'Keto', 'High-Protein' to Diet schema enum", "Resolved & Verified"],
        ["BUG-03", "Frontend", "Duplicate calorie string '(100cal) (500 kcal)' in diet cards", "Streamlined display to render clean meal descriptions", "Resolved & Verified"],
        ["BUG-04", "Owner UI", "'loadStats is not defined' error when saving payment edits", "Replaced with loadAllData() and defined loadStats fallback", "Resolved & Verified"]
    ]
    create_table(doc, ["Bug ID", "Module", "Defect & Root Cause", "Resolution Implemented", "Status"], bug_table_rows, [0.8, 1.0, 2.0, 1.8, 0.9])

    doc.add_page_break()

    # ==================== CHAPTER 8 ====================
    print("Generating Chapter 8...")
    add_heading_1(doc, "CHAPTER 8: DEPLOYMENT & HOSTING")
    
    add_heading_2(doc, "8.1 Cloud Deployment & Local Hosting Architecture")
    add_body_p(doc, "The deployment of Uchala Dumbell Gym is organized across a cloud three-tier infrastructure separating presentation, REST API services, and persistent document storage.\n• Frontend: Static HTML5, CSS3, and JavaScript assets served via Express.\n• Backend: Node.js 20 & Express REST API hosted on Render Cloud.\n• Database: MongoDB Atlas cloud replica set cluster.")

    add_heading_2(doc, "8.3 Server Configuration & Secure Environment Variables")
    add_body_p(doc, "System credentials are decoupled from source code and managed as secure environment variables:\n• `PORT`: Application network port (default: 5000).\n• `MONGO_URI`: Secure MongoDB Atlas connection URI with TLS encryption.\n• `JWT_SECRET`: 256-bit cryptographic secret key for signing user authentication tokens.\n• `NODE_ENV`: Set to 'production'.")

    add_heading_2(doc, "8.4 Version Control using GitHub & Project Directory Tree")
    add_body_p(doc, "Source code is version-controlled using Git and hosted remotely on GitHub (`sujalmanjrekar8-sys/uchaladumbellgymbysujal`). Every push to the `main` branch automatically triggers continuous deployment (CI/CD) on Render.")

    add_heading_2(doc, "8.6 Render Cloud Web Service Deployment")
    add_body_p(doc, "The application is deployed on Render as a Web Service:\n• Build Command: `npm install`\n• Start Command: `node backend/server.js`\n• Live Production URL: `https://uchaladumbellgymbysujal.onrender.com`")

    doc.add_page_break()

    # ==================== CHAPTER 9 ====================
    print("Generating Chapter 9...")
    add_heading_1(doc, "CHAPTER 9: PERFORMANCE & SECURITY TESTING")
    
    add_heading_2(doc, "9.1 Basic Load Testing & Response Benchmarks")
    add_body_p(doc, "Performance benchmarking evaluated API responsiveness under simulated multi-user traffic:")
    perf_rows = [
        ["POST /api/auth/login", "100 concurrent requests", "95 ms (includes bcrypt compare)", "0.0%"],
        ["GET /api/owner/stats", "100 concurrent requests", "48 ms", "0.0%"],
        ["GET /api/member/today-workout", "100 concurrent requests", "52 ms", "0.0%"],
        ["POST /api/owner/assign-plan", "100 concurrent requests", "68 ms", "0.0%"]
    ]
    create_table(doc, ["API Endpoint", "Test Workload", "Avg Latency", "Error Rate"], perf_rows, [2.2, 1.8, 1.5, 1.0])

    add_heading_2(doc, "9.2 Input Validation Checks & Sanitization")
    add_body_p(doc, "• Duplicate Email Prevention: Registration rejects duplicate email addresses with HTTP 400.\n• Numeric Boundary Checks: Negative prices, invalid phone numbers, or negative fees are rejected.\n• Enumeration Constraints: Diet types and user roles strictly validate against Mongoose schema definitions.")

    add_heading_2(doc, "9.3 Security Validation & Penetration Resistance")
    add_body_p(doc, "• JWT Token Verification: Access without a valid Bearer token is rejected with HTTP 401.\n• Role-Based Guarding: Non-owner tokens attempting owner endpoints receive HTTP 403 Forbidden.\n• Password Hashing: User passwords are stored strictly as 10-round bcrypt hashes.")

    doc.add_page_break()

    # ==================== CHAPTER 10 ====================
    print("Generating Chapter 10 (Results & Discussion)...")
    add_heading_1(doc, "CHAPTER 10: RESULT AND DISCUSSION")
    
    add_heading_2(doc, "10.1 Technical Report & Module Deliverables Summary")
    add_body_p(doc, "Uchala Dumbell Gym by Sujal delivers a complete, production-ready cloud management platform for fitness centers. Key engineering deliverables include:\n• Frontend Deliverables: Responsive HTML5/CSS3/JavaScript dashboards for Owner, Trainer, and Member, custom centered modal dialogs, and interactive weekly day selectors.\n• Backend Deliverables: Node.js/Express REST API with 30+ endpoints covering Auth, Owner operations, Trainer workflows, and Member features.\n• Database Deliverables: MongoDB Atlas cloud schemas for Users, MembershipPlans, Workouts, Diets, Payments, Salaries, and Attendance.\n• Testing & Deployment: Comprehensive 28-item test suite with 100% pass rate, continuous GitHub CI/CD, and live deployment on Render.")

    add_heading_2(doc, "10.2 User Manual & Operational Walkthrough (Steps 1 to 7)")
    
    add_heading_3(doc, "10.2.1 Step 1: Authentication & Role-Based Routing")
    add_body_p(doc, "1. Open `https://uchaladumbellgymbysujal.onrender.com/login.html`.\n2. Enter your registered email or Gym ID (e.g. `owner@uchala.com` or `UDGMEM-1001`) and password.\n3. The backend validates credentials and automatically redirects you to your role dashboard (Owner, Trainer, or Member).")

    add_heading_3(doc, "10.2.2 Step 2: Owner Dashboard & Desk Operations")
    add_body_p(doc, "1. Overview: View real-time Active Members, Trainers, Total Revenue, and Outstanding Dues.\n2. Register Member: Click '+ Register Member', input personal details, select a Membership Plan and Trainer, and enter initial fee paid.\n3. Assign Membership Plan: Use the dedicated 'Assign Membership Plan' sidebar tab to select an athlete, pick a plan, set start date, and click 'Activate Membership Plan'.\n4. Payments & Invoicing: View customer payments, collect pending dues via 'Pay Due', and edit payment notes.")

    add_heading_3(doc, "10.2.3 Step 3: Trainer Payroll & Salary Vouchers")
    add_body_p(doc, "1. Hire Trainer: Click '+ Hire Trainer', enter name, phone, specialization, and monthly base salary.\n2. Issue Salary: In the 'Trainer Salaries' section, select a coach, input month, bonuses, and deductions. Click 'Issue Salary Voucher' to generate sequential voucher `SAL-UDG-XXXX`.")

    add_heading_3(doc, "10.2.4 Step 4: Trainer Workout Routine Builder")
    add_body_p(doc, "1. Login with Trainer account and navigate to 'Workout Routines'.\n2. Select an assigned athlete, choose a day of the week (Monday through Sunday), input exercise names, sets, reps, target weight, and coach notes.\n3. Click 'Save Workout Split'. Use 'Mark Done' when the athlete completes the session.")

    add_heading_3(doc, "10.2.5 Step 5: Trainer Nutritional Diet Chart Builder")
    add_body_p(doc, "1. Open the 'Diet Plans' section on the Trainer Dashboard.\n2. Select an athlete, pick a diet type (Vegetarian, Non-Vegetarian, Eggitarian, Vegan, Keto), and write meal descriptions for Breakfast, Lunch, Pre-Workout, and Dinner.\n3. Click 'Save Diet Plan' to publish the meal sheet directly to the athlete's portal.")

    add_heading_3(doc, "10.2.6 Step 6: Member Workout & Weekly Day Selector")
    add_body_p(doc, "1. Login with Member credentials.\n2. Active Plan Card: View your membership plan name, perks, price, expiry date, and days remaining.\n3. Workout Routine: Today's exercises appear automatically. Tap any day pill (Monday to Sunday) to inspect upcoming splits and coach completion status.")

    add_heading_3(doc, "10.2.7 Step 7: Attendance & Payment Receipts")
    add_body_p(doc, "1. Athletes and coaches can view their complete daily check-in attendance records.\n2. Members can review all past billing invoices and fee receipts.")

    add_heading_2(doc, "10.4 Source Code Documentation & Core Module Listings")
    
    add_heading_3(doc, "10.4.1 Plan Assignment Controller (Backend)")
    add_code_block(doc, 
        "// POST /api/owner/assign-plan\n"
        "const assignPlanToMember = async (req, res) => {\n"
        "  try {\n"
        "    const { memberId, planId, startDate } = req.body;\n"
        "    const member = await User.findById(memberId);\n"
        "    const plan = await MembershipPlan.findById(planId);\n"
        "    const start = startDate ? new Date(startDate) : new Date();\n"
        "    const end = new Date(start);\n"
        "    end.setMonth(end.getMonth() + Number(plan.durationInMonths));\n"
        "    member.currentPlan = plan._id;\n"
        "    member.planStartDate = start;\n"
        "    member.planEndDate = end;\n"
        "    await member.save();\n"
        "    res.status(200).json({ success: true, message: `Plan '${plan.planName}' assigned to ${member.name}.` });\n"
        "  } catch (error) {\n"
        "    res.status(500).json({ success: false, message: error.message });\n"
        "  }\n"
        "};"
    )

    add_heading_3(doc, "10.4.2 Timezone-Synchronized Member Workout Controller")
    add_code_block(doc, 
        "// GET /api/member/today-workout\n"
        "const getTodayWorkout = async (req, res) => {\n"
        "  try {\n"
        "    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];\n"
        "    const currentDay = req.query.day || daysOfWeek[new Date().getDay()];\n"
        "    const todayWorkouts = await Workout.find({ member: req.user._id, day: currentDay })\n"
        "      .populate('trainer', 'name gymId specialization');\n"
        "    res.status(200).json({ success: true, currentDay, todayWorkouts });\n"
        "  } catch (error) {\n"
        "    res.status(500).json({ success: false, message: error.message });\n"
        "  }\n"
        "};"
    )

    add_heading_2(doc, "10.4.8 Code-to-Module Mapping")
    mod_map_rows = [
        ["Authentication", "backend/controllers/authController.js", "User login, password verification, and JWT generation."],
        ["Owner Operations", "backend/controllers/ownerController.js", "Member/Trainer CRUD, Plan assignment, Payments, Salaries."],
        ["Trainer Operations", "backend/controllers/trainerController.js", "Trainees roster, Workout logging, Status toggle, Diet charts."],
        ["Member Operations", "backend/controllers/memberController.js", "Plan validity countdown, Today's workout, Diet cards."],
        ["Custom Dialogs", "frontend/custom-dialog.js", "Dark & gold centered modal alert and confirm engine."],
        ["Database Models", "backend/models/*.js", "Mongoose schemas for User, Plan, Workout, Diet, Payment, Salary."]
    ]
    create_table(doc, ["Module", "Core Source Files", "Primary Responsibility"], mod_map_rows, [1.5, 2.3, 2.5])

    add_heading_2(doc, "10.4.9 Result Discussion")
    add_body_p(doc, "The implementation demonstrates that all gym management workflows are connected seamlessly from the responsive frontend to Express REST controllers and MongoDB Atlas persistence. Sequential ID generation ensures professional gym branding across all records. Timezone synchronization guarantees that athletes in India view their workout routines accurately regardless of cloud server time.")

    add_heading_2(doc, "10.4.10 Limitations Identified from the Current Implementation")
    add_bullet_p(doc, "The current scope does not include physical turnstile biometric hardware integration.")
    add_bullet_p(doc, "SMS and WhatsApp automated messaging gateways require paid third-party API integration.")
    add_bullet_p(doc, "A dedicated native Android/iOS mobile application is planned for Phase 2 development.")

    add_heading_2(doc, "10.4.11 Overall Result")
    add_body_p(doc, "Uchala Dumbell Gym successfully achieves the objective of providing a centralized, reliable, and user-friendly gym management platform for gym owners, personal trainers, and athletes.")

    doc.add_page_break()

    # ==================== CONCLUSION ====================
    print("Generating Conclusion & References...")
    p_con = doc.add_paragraph()
    p_con.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_con.add_run("CONCLUSION\n")
    r.font.name = 'Arial'
    r.font.size = Pt(14)
    r.font.bold = True

    add_body_p(doc, "The Uchala Dumbell Gym Management System was developed to address common everyday challenges faced by modern fitness centres: manual record-keeping on paper ledgers, uncollected membership dues, uncoordinated workout and diet distributions, and lack of real-time attendance tracking. The project successfully delivers a complete cloud-hosted web solution in which gym owners, trainers, and athletes interact through a single, well-organized platform. By replacing manual paperwork with an automated digital system, Uchala Dumbell Gym saves administrative time, eliminates billing errors, and gives coaches and athletes transparent tools to manage their fitness journey.")
    add_body_p(doc, "The system is built using a clean three-tier architecture. The backend is a Node.js and Express REST API organized into controllers, middleware, and models, keeping business logic distinct from data access. The frontend is built with HTML5, CSS3, JavaScript (ES6), and responsive dark/gold theming (`#0b0d13`, `#f39c12`), while MongoDB Atlas serves as the scalable cloud database storing users, plans, workouts, diets, payments, salaries, and attendance records.")
    add_body_p(doc, "During the development of this project, valuable practical experience was gained in designing NoSQL document schemas, building REST APIs with Express, handling JWT authentication, implementing custom UI dialogs, resolving timezone offset discrepancies, and deploying full-stack web applications on cloud infrastructure (Render) with continuous GitHub CI/CD.")
    add_body_p(doc, "In conclusion, Uchala Dumbell Gym fulfills all prescribed academic requirements and serves as a strong foundation for full-stack cloud web engineering.")

    doc.save(output_path)
    print(f"Successfully generated Ruparel College Black Book at: {output_path}")

if __name__ == "__main__":
    out = os.path.join(os.getcwd(), "Uchala_Dumbell_Gym_Black_Book_Ruparel_College.docx")
    build_ruparel_black_book(out)
